const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Complaint = require('../models/Complaint');
const GovernmentOfficer = require('../models/GovernmentOfficer');
const { createUser, createSeller } = require('./helpers');

const createComplaint = async (customerToken, seller, overrides = {}) => {
  const res = await request(app)
    .post('/api/complaints')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      category: 'quality_issue',
      title: 'The product arrived damaged',
      description: 'The packaging was torn and the contents were spoiled on arrival.',
      sellerId: seller._id.toString(),
      ...overrides,
    });
  return res.body.data.complaintId;
};

const createOfficer = async () => {
  const { user, token } = await createUser({ role: 'officer' });
  const officer = await GovernmentOfficer.create({ userId: user._id, department: 'Consumer Affairs' });
  return { user, token, officer };
};

describe('GET /api/complaints/:complaintId/assignment-score (Sprint 2, Ticket 2.3)', () => {
  it('rejects a customer', async () => {
    const { token: customerToken } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const complaintId = await createComplaint(customerToken, seller);

    const res = await request(app)
      .get(`/api/complaints/${complaintId}/assignment-score`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });

  it('rejects an officer — assignment scoring is admin-only', async () => {
    const { token: customerToken } = await createUser({ role: 'customer' });
    const { token: officerToken } = await createOfficer();
    const { seller } = await createSeller();
    const complaintId = await createComplaint(customerToken, seller);

    const res = await request(app)
      .get(`/api/complaints/${complaintId}/assignment-score`)
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(403);
  });

  it('is read-only: does not change the complaint status or assignedOfficer', async () => {
    const { token: customerToken } = await createUser({ role: 'customer' });
    const { token: adminToken } = await createUser({ role: 'admin' });
    const { seller } = await createSeller();
    await createOfficer();
    const complaintId = await createComplaint(customerToken, seller);

    const res = await request(app)
      .get(`/api/complaints/${complaintId}/assignment-score`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.bestOfficer).toBeDefined();

    const complaint = await Complaint.findById(complaintId);
    expect(complaint.status).toBe('submitted');
    expect(complaint.assignedOfficer).toBeFalsy();
  });

  it('returns bestOfficer: null with a message when there are no active officers', async () => {
    const { token: customerToken } = await createUser({ role: 'customer' });
    const { token: adminToken } = await createUser({ role: 'admin' });
    const { seller } = await createSeller();
    const complaintId = await createComplaint(customerToken, seller);

    const res = await request(app)
      .get(`/api/complaints/${complaintId}/assignment-score`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.bestOfficer).toBeNull();
  });
});

describe('POST /api/complaints/:complaintId/auto-assign (Sprint 2, Ticket 2.3)', () => {
  it('rejects a non-admin', async () => {
    const { token: customerToken } = await createUser({ role: 'customer' });
    const { seller } = await createSeller();
    const complaintId = await createComplaint(customerToken, seller);

    const res = await request(app)
      .post(`/api/complaints/${complaintId}/auto-assign`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });

  it('fails with 400 when there are no active officers', async () => {
    const { token: customerToken } = await createUser({ role: 'customer' });
    const { token: adminToken } = await createUser({ role: 'admin' });
    const { seller } = await createSeller();
    const complaintId = await createComplaint(customerToken, seller);

    const res = await request(app)
      .post(`/api/complaints/${complaintId}/auto-assign`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  it('assigns the complaint to the engine-picked officer and moves it to under_review', async () => {
    const { token: customerToken } = await createUser({ role: 'customer' });
    const { token: adminToken } = await createUser({ role: 'admin' });
    const { seller } = await createSeller();
    const { officer } = await createOfficer();
    const complaintId = await createComplaint(customerToken, seller);

    const res = await request(app)
      .post(`/api/complaints/${complaintId}/auto-assign`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('under_review');
    expect(res.body.data.assignedOfficer).toBe(officer._id.toString());
    expect(res.body.assignmentScore).toBeGreaterThanOrEqual(0);
  });

  it('returns 404 for a malformed complaint id', async () => {
    const { token: adminToken } = await createUser({ role: 'admin' });

    const res = await request(app)
      .post('/api/complaints/not-a-valid-id/auto-assign')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
