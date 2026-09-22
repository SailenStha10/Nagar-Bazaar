const mongoose = require('mongoose');
const ComplaintAssignmentEngine = require('../algorithms/complaintAssignment');
const Complaint = require('../models/Complaint');
const GovernmentOfficer = require('../models/GovernmentOfficer');
const { createUser } = require('./helpers');

let complaintCounter = 0;

const createOfficer = async () => {
  const { user } = await createUser({ role: 'officer' });
  return GovernmentOfficer.create({ userId: user._id, department: 'Consumer Affairs' });
};

const createComplaintFor = async (officerId, overrides = {}) => {
  const { user } = await createUser({ role: 'customer' });
  return Complaint.create({
    complaintNumber: `TEST-${Date.now()}-${complaintCounter++}`,
    userId: user._id,
    category: overrides.category || 'quality_issue',
    title: 'A sufficiently long complaint title',
    description: 'A sufficiently long complaint description explaining the issue in detail.',
    status: overrides.status || 'under_review',
    assignedOfficer: officerId,
    timeline: overrides.timeline || [{ status: 'submitted', timestamp: new Date() }],
  });
};

describe('ComplaintAssignmentEngine - Scoring Utilities (Sprint 2, Ticket 2.1)', () => {
  let engine;

  beforeAll(() => {
    engine = new ComplaintAssignmentEngine();
  });

  describe('getWorkloadScore', () => {
    test('is 1 for an officer with zero active complaints', async () => {
      const officer = await createOfficer();
      const result = await engine.getWorkloadScore(officer._id);
      expect(result.score).toBe(1);
      expect(result.activeComplaints).toBe(0);
    });

    test('decreases as active (under_review/in_progress) complaints pile up, ignoring resolved ones', async () => {
      const officer = await createOfficer();
      await createComplaintFor(officer._id, { status: 'under_review' });
      await createComplaintFor(officer._id, { status: 'in_progress' });
      await createComplaintFor(officer._id, { status: 'resolved' }); // should not count

      const result = await engine.getWorkloadScore(officer._id);
      expect(result.activeComplaints).toBe(2);
      expect(result.score).toBeCloseTo(1 - 2 / 50);
    });
  });

  describe('getExpertiseScore', () => {
    test('defaults to 0.5 when the officer has no resolved complaints', async () => {
      const officer = await createOfficer();
      const result = await engine.getExpertiseScore(officer._id, 'quality_issue');
      expect(result.score).toBe(0.5);
    });

    test('is the share of resolved complaints that match the category', async () => {
      const officer = await createOfficer();
      await createComplaintFor(officer._id, { category: 'quality_issue', status: 'resolved' });
      await createComplaintFor(officer._id, { category: 'quality_issue', status: 'resolved' });
      await createComplaintFor(officer._id, { category: 'overpricing', status: 'resolved' });

      const result = await engine.getExpertiseScore(officer._id, 'quality_issue');
      expect(result.score).toBeCloseTo(2 / 3);
      expect(result.totalResolved).toBe(3);
    });
  });

  describe('getExperienceScore', () => {
    test('defaults to 0.5 when the officer has never been assigned a complaint', async () => {
      const officer = await createOfficer();
      const result = await engine.getExperienceScore(officer._id);
      expect(result.score).toBe(0.5);
    });

    test('is the officer\'s overall resolution rate', async () => {
      const officer = await createOfficer();
      await createComplaintFor(officer._id, { status: 'resolved' });
      await createComplaintFor(officer._id, { status: 'resolved' });
      await createComplaintFor(officer._id, { status: 'in_progress' });

      const result = await engine.getExperienceScore(officer._id);
      expect(result.score).toBeCloseTo(2 / 3);
      expect(result.total).toBe(3);
    });
  });

  describe('getAverageResponseTime / getAvailabilityScore', () => {
    test('returns 0 average response time (and max availability) when there is no second timeline entry', async () => {
      const officer = await createOfficer();
      await createComplaintFor(officer._id, { timeline: [{ status: 'submitted', timestamp: new Date() }] });

      const avg = await engine.getAverageResponseTime(officer._id);
      expect(avg).toBe(0);

      const availability = await engine.getAvailabilityScore(officer._id);
      expect(availability.score).toBe(1);
    });

    test('computes hours between the first two timeline entries and scores against the 48h target', async () => {
      const officer = await createOfficer();
      const submittedAt = new Date('2026-01-01T00:00:00Z');
      const respondedAt = new Date('2026-01-01T12:00:00Z'); // 12 hours later

      await createComplaintFor(officer._id, {
        timeline: [
          { status: 'submitted', timestamp: submittedAt },
          { status: 'under_review', timestamp: respondedAt },
        ],
      });

      const avg = await engine.getAverageResponseTime(officer._id);
      expect(avg).toBeCloseTo(12);

      const availability = await engine.getAvailabilityScore(officer._id);
      expect(availability.score).toBeCloseTo(1 - 12 / 48);
    });
  });
});

describe('ComplaintAssignmentEngine - Assignment Logic (Sprint 2, Ticket 2.2)', () => {
  let engine;

  beforeAll(() => {
    engine = new ComplaintAssignmentEngine();
  });

  test('calculateAssignmentScore is the 30/40/20/10 weighted blend of the four sub-scores', async () => {
    const officer = await createOfficer();
    await createComplaintFor(officer._id, { category: 'quality_issue', status: 'resolved' });
    await createComplaintFor(officer._id, { category: 'overpricing', status: 'in_progress' });

    const result = await engine.calculateAssignmentScore(officer._id, 'quality_issue');
    const { workload, expertise, experience, availability } = result.breakdown;
    const expected = workload * 0.3 + expertise * 0.4 + experience * 0.2 + availability * 0.1;

    expect(result.finalScore).toBeCloseTo(expected);
  });

  test('findBestOfficer picks the officer with the highest final score', async () => {
    const weakOfficer = await createOfficer();
    const strongOfficer = await createOfficer();

    // weakOfficer: heavy active workload, no resolution history
    await Promise.all(
      Array.from({ length: 10 }).map(() => createComplaintFor(weakOfficer._id, { status: 'in_progress' }))
    );

    // strongOfficer: light workload, strong resolution history in this category
    await createComplaintFor(strongOfficer._id, { category: 'quality_issue', status: 'resolved' });
    await createComplaintFor(strongOfficer._id, { category: 'quality_issue', status: 'resolved' });

    const result = await engine.findBestOfficer('quality_issue');

    expect(result.success).toBe(true);
    expect(result.bestOfficer._id.toString()).toBe(strongOfficer._id.toString());
  });

  test('findBestOfficer excludes officers whose linked user account is inactive', async () => {
    const { user: inactiveUser } = await createUser({ role: 'officer', isActive: false });
    const inactiveOfficer = await GovernmentOfficer.create({ userId: inactiveUser._id, department: 'Test' });
    const activeOfficer = await createOfficer();

    const result = await engine.findBestOfficer('quality_issue');

    expect(result.success).toBe(true);
    const ids = result.allScores.map((s) => s.officer._id.toString());
    expect(ids).toContain(activeOfficer._id.toString());
    expect(ids).not.toContain(inactiveOfficer._id.toString());
  });

  test('findBestOfficer reports failure when there are no active officers', async () => {
    const result = await engine.findBestOfficer('quality_issue');
    expect(result.success).toBe(false);
  });
});

describe('ComplaintAssignmentEngine - assignComplaint / batchAssignComplaints (Sprint 2, Ticket 2.4)', () => {
  let engine;

  beforeAll(() => {
    engine = new ComplaintAssignmentEngine();
  });

  test('assignComplaint returns failure for a complaint id that does not exist', async () => {
    const result = await engine.assignComplaint(new mongoose.Types.ObjectId());
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/not found/i);
  });

  test('assignComplaint moves a submitted complaint to under_review and logs a timeline entry', async () => {
    const officer = await createOfficer();
    const submitted = await createComplaintFor(officer._id, {
      status: 'submitted',
      timeline: [{ status: 'submitted', timestamp: new Date() }],
    });
    // Clear assignedOfficer so this behaves like a genuinely unassigned complaint.
    submitted.assignedOfficer = undefined;
    await submitted.save();

    const result = await engine.assignComplaint(submitted._id);

    expect(result.success).toBe(true);
    expect(result.complaint.status).toBe('under_review');
    expect(result.complaint.assignedOfficer.toString()).toBe(officer._id.toString());
    expect(result.complaint.timeline.length).toBe(2);
    expect(result.complaint.timeline[1].message).toMatch(/auto-assigned/i);
  });

  test('batchAssignComplaints only touches submitted+unassigned complaints, up to the batch size', async () => {
    const officer = await createOfficer();

    const unassigned1 = await createComplaintFor(officer._id, { status: 'submitted' });
    unassigned1.assignedOfficer = undefined;
    await unassigned1.save();

    const unassigned2 = await createComplaintFor(officer._id, { status: 'submitted' });
    unassigned2.assignedOfficer = undefined;
    await unassigned2.save();

    // Already assigned + in_progress: batch job must leave this alone.
    const alreadyAssigned = await createComplaintFor(officer._id, { status: 'in_progress' });

    const result = await engine.batchAssignComplaints(10);

    expect(result.success).toBe(true);
    expect(result.assigned).toBe(2);

    const untouched = await Complaint.findById(alreadyAssigned._id);
    expect(untouched.status).toBe('in_progress');
  });

  test('batchAssignComplaints respects the batchSize cap', async () => {
    const officer = await createOfficer();
    for (let i = 0; i < 3; i++) {
      const c = await createComplaintFor(officer._id, { status: 'submitted' });
      c.assignedOfficer = undefined;
      await c.save();
    }

    const result = await engine.batchAssignComplaints(2);
    expect(result.assigned).toBe(2);

    const stillSubmitted = await Complaint.countDocuments({ status: 'submitted', assignedOfficer: { $exists: false } });
    expect(stillSubmitted).toBe(1);
  });
});
