const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const ComplaintAssignmentEngine = require('../algorithms/complaintAssignment');

const engine = new ComplaintAssignmentEngine();

// Trim the algorithm's raw per-officer breakdown down to what the client needs.
const formatScoreEntry = (entry) => ({
  officerId: entry.officer._id,
  officerName: entry.officer.userId?.name,
  department: entry.officer.department,
  finalScore: entry.finalScore,
  breakdown: entry.breakdown,
});

/**
 * GET /api/complaints/:complaintId/assignment-score
 * Read-only: shows how every active officer scores for this complaint's
 * category, and who the engine would pick. Does not change any data.
 */
const getAssignmentScore = async (req, res) => {
  try {
    const { complaintId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const result = await engine.findBestOfficer(complaint.category);
    if (!result.success) {
      return res.status(200).json({ success: true, bestOfficer: null, allScores: [], message: result.message });
    }

    res.status(200).json({
      success: true,
      bestOfficer: formatScoreEntry(result.allScores[0]),
      allScores: result.allScores.map(formatScoreEntry),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/complaints/:complaintId/auto-assign
 * Assigns the complaint to whichever active officer the scoring engine
 * ranks highest for its category. Separate from the existing manual
 * PUT /:complaintId/assign, which takes an explicit officerId.
 */
const autoAssignComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const result = await engine.assignComplaint(complaintId);
    if (!result.success) {
      const status = result.message === 'Complaint not found' ? 404 : 400;
      return res.status(status).json({ success: false, message: result.message || result.error });
    }

    res.status(200).json({
      success: true,
      message: 'Complaint auto-assigned',
      data: result.complaint,
      assignmentScore: result.assignmentScore,
      breakdown: result.breakdown,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAssignmentScore, autoAssignComplaint };
