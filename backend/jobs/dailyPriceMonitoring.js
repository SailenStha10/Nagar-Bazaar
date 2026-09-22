const schedule = require('node-schedule');
const PriceAnomalyEngine = require('../algorithms/priceAnomaly');

const engine = new PriceAnomalyEngine();

/**
 * Runs once a day at 02:00, refreshing every active product's MarketPrice
 * record against its computed peer average. Call once at server startup
 * (skipped in tests).
 */
function scheduleDailyPriceMonitoring() {
  const job = schedule.scheduleJob('0 2 * * *', async () => {
    try {
      const result = await engine.scanAllProducts();
      console.log(
        `[Daily Price Monitoring] checked=${result.productsChecked} scanned=${result.scanned} flagged=${result.flagged} at ${new Date().toISOString()}`
      );
    } catch (error) {
      console.error('[Daily Price Monitoring] Error:', error.message);
    }
  });

  console.log('[Daily Price Monitoring] Scheduled to run daily at 02:00');
  return job;
}

module.exports = { scheduleDailyPriceMonitoring };
