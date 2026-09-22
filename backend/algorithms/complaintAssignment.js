const mongoose = require('mongoose');

const MAX_WORKLOAD = 50;
const IDEAL_RESPONSE_HOURS = 48;
const ACTIVE_STATUSES = ['under_review', 'in_progress'];

class ComplaintAssignmentEngine {
  /**
   * Workload score: fewer active (assigned, unresolved) complaints is better.
   * Range: 0-1 (1 = no workload, 0 = at or above MAX_WORKLOAD)
   */
  async getWorkloadScore(officerId) {
    try {
      const activeComplaints = await mongoose.model('Complaint').countDocuments({
        assignedOfficer: officerId,
        status: { $in: ACTIVE_STATUSES },
      });

      const score = Math.max(0, 1 - activeComplaints / MAX_WORKLOAD);

      return {
        score,
        activeComplaints,
        utilizationPercentage: (activeComplaints / MAX_WORKLOAD) * 100,
      };
    } catch (error) {
      console.error('Error calculating workload score:', error);
      return { score: 0.5, activeComplaints: 0, error: error.message };
    }
  }

  /**
   * Expertise score: share of this officer's resolved complaints that were
   * in the given category. Range: 0-1
   */
  async getExpertiseScore(officerId, category) {
    try {
      const categoryComplaints = await mongoose.model('Complaint').countDocuments({
        assignedOfficer: officerId,
        category,
        status: 'resolved',
      });

      const totalResolved = await mongoose.model('Complaint').countDocuments({
        assignedOfficer: officerId,
        status: 'resolved',
      });

      if (totalResolved === 0) return { score: 0.5, categoryComplaints: 0, totalResolved: 0 };

      return {
        score: Math.min(categoryComplaints / totalResolved, 1),
        categoryComplaints,
        totalResolved,
      };
    } catch (error) {
      console.error('Error calculating expertise score:', error);
      return { score: 0.5, categoryComplaints: 0, error: error.message };
    }
  }

  /**
   * Experience score: overall resolution rate across every complaint ever
   * assigned to this officer. Range: 0-1
   */
  async getExperienceScore(officerId) {
    try {
      const resolved = await mongoose.model('Complaint').countDocuments({
        assignedOfficer: officerId,
        status: 'resolved',
      });

      const total = await mongoose.model('Complaint').countDocuments({ assignedOfficer: officerId });

      if (total === 0) return { score: 0.5, resolved: 0, total: 0 };

      return {
        score: resolved / total,
        resolved,
        total,
        resolutionPercentage: ((resolved / total) * 100).toFixed(2),
      };
    } catch (error) {
      console.error('Error calculating experience score:', error);
      return { score: 0.5, resolved: 0, total: 0, error: error.message };
    }
  }

  /**
   * Average hours between a complaint's first timeline entry (submitted)
   * and its second (the officer's first response), across resolved-or-later
   * complaints that actually have a second timeline entry.
   */
  async getAverageResponseTime(officerId) {
    try {
      const complaints = await mongoose.model('Complaint')
        .find({ assignedOfficer: officerId })
        .select('timeline')
        .lean();

      let totalHours = 0;
      let count = 0;

      for (const complaint of complaints) {
        if (complaint.timeline && complaint.timeline.length >= 2) {
          const submittedAt = new Date(complaint.timeline[0].timestamp);
          const respondedAt = new Date(complaint.timeline[1].timestamp);
          totalHours += (respondedAt - submittedAt) / (1000 * 60 * 60);
          count++;
        }
      }

      return count > 0 ? totalHours / count : 0;
    } catch (error) {
      console.error('Error calculating response time:', error);
      return 0;
    }
  }

  /**
   * Availability score: how close the officer's average first-response time
   * is to the 48-hour target. Range: 0-1
   */
  async getAvailabilityScore(officerId) {
    try {
      const avgResponseHours = await this.getAverageResponseTime(officerId);
      const score = Math.max(0, 1 - avgResponseHours / IDEAL_RESPONSE_HOURS);

      return { score, averageResponseHours: avgResponseHours };
    } catch (error) {
      console.error('Error calculating availability score:', error);
      return { score: 0.5, averageResponseHours: 0, error: error.message };
    }
  }

  /**
   * Final weighted score for one officer against a given complaint category.
   * Weights: workload 0.30, expertise 0.40, experience 0.20, availability 0.10
   */
  async calculateAssignmentScore(officerId, complaintCategory) {
    const [workload, expertise, experience, availability] = await Promise.all([
      this.getWorkloadScore(officerId),
      this.getExpertiseScore(officerId, complaintCategory),
      this.getExperienceScore(officerId),
      this.getAvailabilityScore(officerId),
    ]);

    const finalScore = workload.score * 0.3 + expertise.score * 0.4 + experience.score * 0.2 + availability.score * 0.1;

    return {
      officerId,
      finalScore,
      breakdown: {
        workload: workload.score,
        expertise: expertise.score,
        experience: experience.score,
        availability: availability.score,
      },
      details: { workload, expertise, experience, availability },
    };
  }

  /**
   * Score every active officer (their linked User must be isActive) for a
   * complaint category and return the highest scorer.
   */
  async findBestOfficer(complaintCategory) {
    try {
      const officers = await mongoose.model('GovernmentOfficer').find().populate('userId').lean();
      const activeOfficers = officers.filter((o) => o.userId?.isActive);

      if (activeOfficers.length === 0) {
        return { success: false, message: 'No available officers' };
      }

      const scores = await Promise.all(
        activeOfficers.map(async (officer) => ({
          officer,
          ...(await this.calculateAssignmentScore(officer._id, complaintCategory)),
        }))
      );

      scores.sort((a, b) => b.finalScore - a.finalScore);
      const best = scores[0];

      return {
        success: true,
        bestOfficer: best.officer,
        score: best.finalScore,
        breakdown: best.breakdown,
        allScores: scores,
      };
    } catch (error) {
      console.error('Error finding best officer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Assign a single complaint to the engine's top-scoring officer, moving
   * a 'submitted' complaint to 'under_review' and logging it in the timeline.
   */
  async assignComplaint(complaintId) {
    try {
      const complaint = await mongoose.model('Complaint').findById(complaintId);
      if (!complaint) {
        return { success: false, message: 'Complaint not found' };
      }

      const officerResult = await this.findBestOfficer(complaint.category);
      if (!officerResult.success) {
        return officerResult;
      }

      complaint.assignedOfficer = officerResult.bestOfficer._id;
      if (complaint.status === 'submitted') {
        complaint.status = 'under_review';
      }
      complaint.timeline.push({
        status: complaint.status,
        timestamp: new Date(),
        message: `Auto-assigned to ${officerResult.bestOfficer.userId?.name || 'officer'} (score ${officerResult.score.toFixed(3)})`,
      });
      await complaint.save();

      return {
        success: true,
        complaint,
        assignmentScore: officerResult.score,
        breakdown: officerResult.breakdown,
        officerName: officerResult.bestOfficer.userId?.name,
      };
    } catch (error) {
      console.error('Error assigning complaint:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Auto-assign every 'submitted', unassigned complaint (capped per run for
   * predictable job duration).
   */
  async batchAssignComplaints(batchSize = 10) {
    try {
      const unassigned = await mongoose.model('Complaint')
        .find({ status: 'submitted', assignedOfficer: { $exists: false } })
        .limit(batchSize);

      const results = [];
      for (const complaint of unassigned) {
        const result = await this.assignComplaint(complaint._id);
        results.push({ complaintId: complaint._id, ...result });
      }

      return {
        success: true,
        assigned: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    } catch (error) {
      console.error('Error in batch assignment:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ComplaintAssignmentEngine;
