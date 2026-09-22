const schedule = require('node-schedule');
const ComplaintAssignmentEngine = require('../algorithms/complaintAssignment');

const engine = new ComplaintAssignmentEngine();

/**
 * Runs every 30 minutes, auto-assigning any 'submitted' complaints that
 * still have no officer. Call once at server startup (skipped in tests).
 */
function scheduleComplaintAssignment() {
  const job = schedule.scheduleJob('*/30 * * * *', async () => {
    try {
      const result = await engine.batchAssignComplaints();
      console.log(
        `[Complaint Assignment Job] assigned=${result.assigned} failed=${result.failed} at ${new Date().toISOString()}`
      );
    } catch (error) {
      console.error('[Complaint Assignment Job] Error:', error.message);
    }
  });

  console.log('[Complaint Assignment Job] Scheduled to run every 30 minutes');
  return job;
}

module.exports = { scheduleComplaintAssignment };
