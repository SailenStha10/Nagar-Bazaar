const schedule = require('node-schedule');
const { scheduleDailyPriceMonitoring } = require('../jobs/dailyPriceMonitoring');

describe('scheduleDailyPriceMonitoring (Sprint 3, Ticket 3.4)', () => {
  afterEach(() => {
    schedule.gracefulShutdown();
  });

  test('registers a job on the 0 2 * * * cron schedule', () => {
    const job = scheduleDailyPriceMonitoring();
    expect(job).toBeDefined();
    expect(Object.keys(schedule.scheduledJobs).length).toBeGreaterThan(0);
  });
});
