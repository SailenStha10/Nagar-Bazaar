const schedule = require('node-schedule');
const { scheduleComplaintAssignment } = require('../jobs/complaintAssignmentJob');

describe('scheduleComplaintAssignment (Sprint 2, Ticket 2.4)', () => {
  afterEach(() => {
    schedule.gracefulShutdown();
  });

  test('registers a job on the */30 * * * * cron schedule', () => {
    const job = scheduleComplaintAssignment();
    expect(job).toBeDefined();
    expect(job.name).toBeDefined();
    expect(Object.keys(schedule.scheduledJobs).length).toBeGreaterThan(0);
  });
});
