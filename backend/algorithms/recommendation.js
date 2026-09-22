const mongoose = require('mongoose');
const { cosineSimilarity } = require('../utils/mathUtils');

class RecommendationEngine {
  /**
   * Get the distinct set of product ids a user has ever ordered.
   */
  async getUserPurchaseVector(userId) {
    try {
      const orders = await mongoose.model('Order').find({ userId }).select('_id').lean();
      if (orders.length === 0) return [];

      const orderIds = orders.map((o) => o._id);
      const orderItems = await mongoose.model('OrderItem')
        .find({ orderId: { $in: orderIds } })
        .select('productId')
        .lean();

      const productSet = new Set(orderItems.map((item) => item.productId.toString()));
      return Array.from(productSet);
    } catch (error) {
      console.error('Error getting user purchase vector:', error);
      return [];
    }
  }

  /**
   * Get active customers, optionally capped for performance.
   */
  async getAllUsers(limit = null) {
    try {
      let query = mongoose.model('User').find({ role: 'customer', isActive: true }).lean();
      if (limit) query = query.limit(limit);
      return await query;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  /**
   * Similarity between two users' purchase sets (cosine over a shared binary vector).
   * Range: 0-1 (1 = identical purchases)
   */
  async getUserSimilarity(userId1, userId2) {
    try {
      const vector1 = await this.getUserPurchaseVector(userId1);
      const vector2 = await this.getUserPurchaseVector(userId2);

      const allProducts = Array.from(new Set([...vector1, ...vector2]));
      if (allProducts.length === 0) return 0;

      const binaryVec1 = allProducts.map((p) => (vector1.includes(p) ? 1 : 0));
      const binaryVec2 = allProducts.map((p) => (vector2.includes(p) ? 1 : 0));

      return cosineSimilarity(binaryVec1, binaryVec2);
    } catch (error) {
      console.error('Error calculating user similarity:', error);
      return 0;
    }
  }

  /**
   * Collaborative Filtering: find similar users and recommend the products
   * they bought that this user hasn't. Weight: 0.4 in the hybrid model.
   */
  async getCollaborativeRecommendations(userId, topN = 5) {
    try {
      const startTime = Date.now();

      const userProducts = await this.getUserPurchaseVector(userId);

      // Limit candidate pool for performance
      const allUsers = await this.getAllUsers(50);
      const otherUsers = allUsers.filter((u) => u._id.toString() !== userId.toString());

      const similarityScores = {};
      for (const otherUser of otherUsers) {
        const similarity = await this.getUserSimilarity(userId, otherUser._id);
        if (similarity > 0) {
          similarityScores[otherUser._id.toString()] = similarity;
        }
      }

      const similarUserIds = Object.keys(similarityScores)
        .sort((a, b) => similarityScores[b] - similarityScores[a])
        .slice(0, 10);

      const recommendations = {};
      for (const simUserId of similarUserIds) {
        const simUserProducts = await this.getUserPurchaseVector(simUserId);
        const similarity = similarityScores[simUserId];

        for (const product of simUserProducts) {
          if (!userProducts.includes(product)) {
            recommendations[product] = (recommendations[product] || 0) + similarity;
          }
        }
      }

      const topRecommendations = Object.entries(recommendations)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([productId, score]) => ({
          productId,
          collaborativeScore: score,
          method: 'collaborative',
        }));

      return {
        recommendations: topRecommendations,
        executionTime: Date.now() - startTime,
        similarUsersFound: similarUserIds.length,
      };
    } catch (error) {
      console.error('Error in collaborative recommendations:', error);
      return { recommendations: [], executionTime: 0, error: error.message };
    }
  }

  /**
   * Build a feature vector for a product: category, price, average rating,
   * seller, and whether it's a local product.
   */
  async getProductFeatureVector(productId) {
    try {
      const product = await mongoose.model('Product').findById(productId).lean();
      if (!product) return null;

      const reviews = await mongoose.model('Review').find({ productId }).select('rating').lean();
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 3;

      return {
        productId: product._id,
        category: product.categoryId?.toString() || 'unknown',
        price: product.price,
        rating: avgRating,
        seller: product.sellerId?.toString() || 'unknown',
        isLocal: product.isLocal ? 1 : 0,
        stock: product.stock > 0 ? 1 : 0,
      };
    } catch (error) {
      console.error('Error getting product feature vector:', error);
      return null;
    }
  }

  /**
   * Similarity between two products based on weighted feature overlap.
   * Weights: category 0.30, price 0.25, rating 0.20, seller 0.15, isLocal 0.10
   * Range: 0-1 (1 = identical products)
   */
  async getProductSimilarity(productId1, productId2) {
    try {
      const feature1 = await this.getProductFeatureVector(productId1);
      const feature2 = await this.getProductFeatureVector(productId2);

      if (!feature1 || !feature2) return 0;

      let similarity = 0;

      if (feature1.category === feature2.category) {
        similarity += 0.3;
      }

      const priceDiff = Math.abs(feature1.price - feature2.price);
      const maxPrice = Math.max(feature1.price, feature2.price) || 1;
      const priceMatch = 1 - priceDiff / maxPrice;
      similarity += Math.max(0, priceMatch) * 0.25;

      const ratingDiff = Math.abs(feature1.rating - feature2.rating);
      const ratingMatch = 1 - ratingDiff / 5;
      similarity += Math.max(0, ratingMatch) * 0.2;

      if (feature1.seller === feature2.seller) {
        similarity += 0.15;
      }

      if (feature1.isLocal === feature2.isLocal) {
        similarity += 0.1;
      }

      return similarity;
    } catch (error) {
      console.error('Error calculating product similarity:', error);
      return 0;
    }
  }

  /**
   * Content-Based Filtering: recommend products similar to what the user
   * already bought. Weight: 0.6 in the hybrid model.
   */
  async getContentBasedRecommendations(userId, topN = 5) {
    try {
      const startTime = Date.now();

      const userProducts = await this.getUserPurchaseVector(userId);

      if (userProducts.length === 0) {
        return { recommendations: [], executionTime: 0, reason: 'No purchase history' };
      }

      const allProducts = await mongoose.model('Product')
        .find({ _id: { $nin: userProducts }, isActive: true })
        .limit(100)
        .lean();

      const productScores = {};

      for (const product of allProducts) {
        let totalSimilarity = 0;

        for (const purchasedId of userProducts) {
          totalSimilarity += await this.getProductSimilarity(product._id, purchasedId);
        }

        productScores[product._id.toString()] = totalSimilarity / userProducts.length;
      }

      const topRecommendations = Object.entries(productScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([productId, score]) => ({
          productId,
          contentScore: score,
          method: 'content',
        }));

      return {
        recommendations: topRecommendations,
        executionTime: Date.now() - startTime,
        productsCompared: allProducts.length,
      };
    } catch (error) {
      console.error('Error in content-based recommendations:', error);
      return { recommendations: [], executionTime: 0, error: error.message };
    }
  }

  /**
   * Normalize a list of {productId, score} entries to 0-1 by dividing by the max score.
   */
  static normalizeScores(entries) {
    if (entries.length === 0) return {};
    const maxScore = Math.max(...entries.map((e) => e.score));
    const normalized = {};
    for (const entry of entries) {
      normalized[entry.productId] = maxScore > 0 ? entry.score / maxScore : 0;
    }
    return normalized;
  }

  /**
   * Hybrid: Score = (0.4 x Collaborative) + (0.6 x Content)
   */
  async getHybridRecommendations(userId, topN = 10) {
    try {
      const startTime = Date.now();

      const [collaborativeResult, contentResult] = await Promise.all([
        this.getCollaborativeRecommendations(userId, topN * 2),
        this.getContentBasedRecommendations(userId, topN * 2),
      ]);

      const collaborativeScores = RecommendationEngine.normalizeScores(
        collaborativeResult.recommendations.map((r) => ({ productId: r.productId, score: r.collaborativeScore }))
      );

      const contentScores = RecommendationEngine.normalizeScores(
        contentResult.recommendations.map((r) => ({ productId: r.productId, score: r.contentScore }))
      );

      const allProductIds = new Set([...Object.keys(collaborativeScores), ...Object.keys(contentScores)]);

      const hybridScores = {};
      for (const productId of allProductIds) {
        const collScore = collaborativeScores[productId] || 0;
        const contentScore = contentScores[productId] || 0;
        hybridScores[productId] = 0.4 * collScore + 0.6 * contentScore;
      }

      const topProductIds = Object.entries(hybridScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([id]) => id);

      const productDetails = await mongoose.model('Product')
        .find({ _id: { $in: topProductIds } })
        .select('_id name price image averageRating sellerId')
        .populate('sellerId', 'shopName')
        .lean();

      const recommendations = topProductIds.map((productId) => {
        const product = productDetails.find((p) => p._id.toString() === productId);
        return {
          productId,
          product,
          hybridScore: hybridScores[productId],
          collaborativeScore: collaborativeScores[productId] || 0,
          contentScore: contentScores[productId] || 0,
        };
      });

      return {
        recommendations,
        executionTime: Date.now() - startTime,
        stats: {
          totalProcessed: allProductIds.size,
          collaborativeUsed: Object.keys(collaborativeScores).length,
          contentUsed: Object.keys(contentScores).length,
        },
      };
    } catch (error) {
      console.error('Error in hybrid recommendations:', error);
      return { recommendations: [], executionTime: 0, error: error.message };
    }
  }
}

module.exports = RecommendationEngine;
