const mongoose = require('mongoose');
const { mean, standardDeviation, zScore } = require('../utils/mathUtils');

const Z_SCORE_THRESHOLD = 2;
const MIN_PEERS_FOR_DETECTION = 3;

class PriceAnomalyEngine {
  /**
   * Prices of every other active product with the same name (case-insensitive)
   * in the same category — i.e. what other sellers charge for the same
   * commodity. Excludes the product itself.
   */
  async getPeerPrices(productId) {
    try {
      const product = await mongoose.model('Product').findById(productId).lean();
      if (!product) return [];

      const peers = await mongoose.model('Product')
        .find({
          _id: { $ne: product._id },
          categoryId: product.categoryId,
          name: { $regex: `^${product.name.trim()}$`, $options: 'i' },
          isActive: true,
        })
        .select('price sellerId')
        .lean();

      return peers.map((p) => p.price);
    } catch (error) {
      console.error('Error getting peer prices:', error);
      return [];
    }
  }

  /**
   * Compares one product's price against the mean/std-dev of its peers'
   * prices (same name + category, different sellers) using a z-score.
   * |z| > 2 flags the price as statistically anomalous.
   */
  async detectAnomaly(productId) {
    try {
      const product = await mongoose.model('Product').findById(productId).select('price').lean();
      if (!product) {
        return { isAnomaly: false, reason: 'Product not found' };
      }

      const peerPrices = await this.getPeerPrices(productId);

      if (peerPrices.length < MIN_PEERS_FOR_DETECTION) {
        return {
          productId,
          price: product.price,
          peerAverage: peerPrices.length ? mean(peerPrices) : null,
          peerCount: peerPrices.length,
          zScoreValue: null,
          isAnomaly: false,
          reason: 'Not enough peer listings to compare',
        };
      }

      const peerAverage = mean(peerPrices);
      const peerStdDev = standardDeviation(peerPrices);
      const z = zScore(product.price, peerPrices);
      const deviationPercent = peerAverage > 0 ? Math.round(((product.price - peerAverage) / peerAverage) * 1000) / 10 : 0;
      const isAnomaly = peerStdDev > 0 && Math.abs(z) > Z_SCORE_THRESHOLD;

      return {
        productId,
        price: product.price,
        peerAverage,
        peerStdDev,
        peerCount: peerPrices.length,
        zScoreValue: z,
        deviationPercent,
        isAnomaly,
        direction: z > 0 ? 'overpriced' : 'underpriced',
      };
    } catch (error) {
      console.error('Error detecting price anomaly:', error);
      return { isAnomaly: false, error: error.message };
    }
  }

  /**
   * Runs detectAnomaly for one product and upserts its MarketPrice record
   * (keyed by productId+sellerId) with the freshly computed peer average and
   * status. Skips products with too few peers to compare against — nothing
   * to monitor yet. Existing remarks/monitoredBy from a prior manual review
   * are preserved; only the computed fields and history are refreshed.
   */
  async scanProduct(productId) {
    try {
      const product = await mongoose.model('Product').findById(productId).select('price sellerId').lean();
      if (!product) return { scanned: false, reason: 'Product not found' };

      const result = await this.detectAnomaly(productId);
      if (result.peerAverage === null || result.peerAverage === undefined) {
        return { scanned: false, reason: result.reason || 'Not enough peer listings to compare' };
      }

      const MarketPrice = mongoose.model('MarketPrice');
      let record = await MarketPrice.findOne({ productId, sellerId: product.sellerId });
      const status = result.isAnomaly ? 'review_required' : 'normal';

      if (!record) {
        record = new MarketPrice({ productId, sellerId: product.sellerId });
      }

      record.price = product.price;
      record.averageMarketPrice = Math.round(result.peerAverage * 100) / 100;
      record.status = status;
      record.lastUpdated = new Date();
      record.history.push({ price: product.price, averageMarketPrice: record.averageMarketPrice, status, date: new Date() });
      await record.save();

      return { scanned: true, isAnomaly: result.isAnomaly, priceId: record._id };
    } catch (error) {
      console.error('Error scanning product:', error);
      return { scanned: false, error: error.message };
    }
  }

  /**
   * Scans every active product (capped per run) and refreshes its
   * MarketPrice record. Intended to be run daily by a scheduled job.
   */
  async scanAllProducts(batchSize = 200) {
    try {
      const products = await mongoose.model('Product').find({ isActive: true }).select('_id').limit(batchSize).lean();

      let scanned = 0;
      let flagged = 0;

      for (const product of products) {
        const result = await this.scanProduct(product._id);
        if (result.scanned) {
          scanned += 1;
          if (result.isAnomaly) flagged += 1;
        }
      }

      return { success: true, productsChecked: products.length, scanned, flagged };
    } catch (error) {
      console.error('Error scanning all products:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = PriceAnomalyEngine;
