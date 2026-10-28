import express from 'express';
import { EligibilityEngine } from '../services/eligibilityEngine.js';
import { ScholarshipService } from '../services/scholarshipService.js';
import { inMemoryDb } from '../config/supabase.js';

const router = express.Router();

/**
 * POST /api/eligibility/evaluate-all
 * Evaluates all directory scholarships against student profile.
 * Uses req.user profile if signed in, or accepts temporary profile in request body.
 */
router.post('/evaluate-all', async (req, res, next) => {
  try {
    const profile = req.body.profile || (req.user && req.user.role !== 'visitor' ? req.user : null);

    const scholarships = await ScholarshipService.getAll({ is_active: true });
    const allRequirements = inMemoryDb.scholarshipRequirements;

    const evaluated = EligibilityEngine.evaluateMany(scholarships, profile, allRequirements);

    // Sort by match score descending, then deadline ascending
    evaluated.sort((a, b) => {
      if (b.eligibility.match_score !== a.eligibility.match_score) {
        return b.eligibility.match_score - a.eligibility.match_score;
      }
      return new Date(a.deadline) - new Date(b.deadline);
    });

    const eligibleCount = evaluated.filter((e) => e.eligibility.match_status === 'ELIGIBLE').length;
    const partialCount = evaluated.filter((e) => e.eligibility.match_status === 'PARTIALLY_ELIGIBLE').length;

    res.json({
      success: true,
      summary: {
        total_evaluated: evaluated.length,
        eligible_count: eligibleCount,
        partially_eligible_count: partialCount,
        ineligible_count: evaluated.length - eligibleCount - partialCount,
        student_profile_used: profile
          ? {
              full_name: profile.full_name,
              gpa: profile.gpa,
              major: profile.major,
              degree_level: profile.degree_level,
              residency_status: profile.residency_status,
              household_income: profile.household_income,
              is_first_generation: profile.is_first_generation,
            }
          : null,
      },
      data: evaluated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/eligibility/check-single
 * Detailed breakdown for a single scholarship
 */
router.post('/check-single', async (req, res, next) => {
  try {
    const { scholarship_id, profile: customProfile } = req.body;
    if (!scholarship_id) {
      return res.status(400).json({ success: false, error: { message: 'scholarship_id is required.' } });
    }

    const scholarship = await ScholarshipService.getById(scholarship_id);
    if (!scholarship) {
      return res.status(404).json({ success: false, error: { message: 'Scholarship not found.' } });
    }

    const profile = customProfile || (req.user && req.user.role !== 'visitor' ? req.user : null);
    const requirements = inMemoryDb.scholarshipRequirements.filter((r) => r.scholarship_id === scholarship_id);

    const evaluation = EligibilityEngine.evaluate(scholarship, profile, requirements);

    res.json({
      success: true,
      scholarship: {
        id: scholarship.id,
        title: scholarship.title,
        provider_name: scholarship.provider_name,
        award_amount: scholarship.award_amount,
        deadline: scholarship.deadline,
        min_gpa: scholarship.min_gpa,
        eligible_majors: scholarship.eligible_majors,
        education_levels: scholarship.education_levels,
        last_verified_at: scholarship.last_verified_at,
        verification_status: scholarship.verification_status,
      },
      evaluation,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/eligibility/quick-check
 * Landing page interactive quick match for visitors
 */
router.post('/quick-check', async (req, res, next) => {
  try {
    const { gpa, major, degree_level, residency_status, household_income, is_first_generation } = req.body;

    const syntheticProfile = {
      full_name: 'Visitor Applicant',
      role: 'student',
      gpa: parseFloat(gpa) || 3.5,
      major: major || 'Computer Science',
      degree_level: degree_level || 'Undergraduate',
      residency_status: residency_status || 'US Citizen',
      household_income: parseFloat(household_income) || 50000.0,
      is_first_generation: Boolean(is_first_generation),
      demographic_tags: [],
    };

    const scholarships = await ScholarshipService.getAll({ is_active: true });
    const evaluated = EligibilityEngine.evaluateMany(scholarships, syntheticProfile, inMemoryDb.scholarshipRequirements);

    // Filter to top matches (eligible or partial)
    const topMatches = evaluated
      .filter((e) => e.eligibility.match_score >= 60)
      .sort((a, b) => b.eligibility.match_score - a.eligibility.match_score)
      .slice(0, 5);

    const totalPotentialAid = topMatches.reduce((sum, s) => sum + (parseFloat(s.award_amount) || 0), 0);

    res.json({
      success: true,
      data: {
        matches: topMatches,
        matches_count: topMatches.length,
        potential_aid_total: totalPotentialAid,
        profile_evaluated: syntheticProfile,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
