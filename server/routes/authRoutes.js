import express from 'express';
import { inMemoryDb, supabase, isSupabaseConnected } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/auth/me
 * Return currently authenticated user profile
 */
router.get('/me', (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

/**
 * GET /api/auth/personas
 * Return seeded demo personas for testing roles without friction
 */
router.get('/personas', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '11111111-1111-4111-a111-111111111111',
        full_name: 'Elena Rostova',
        role: 'student',
        email: 'elena.rostova@university.edu',
        badge: 'Student (Undergrad CS)',
        description: 'First-Gen CS Major, 3.82 GPA, $48k Income. Has 3 active applications.',
      },
      {
        id: '22222222-2222-4222-a222-222222222222',
        full_name: 'Marcus Chen',
        role: 'student',
        email: 'marcus.chen@highschool.edu',
        badge: 'Student (High School Senior)',
        description: 'Pre-Med / Biology, 3.40 GPA, $72k Income. Exploring healthcare awards.',
      },
      {
        id: '33333333-3333-4333-a333-333333333333',
        full_name: 'Sarah Jenkins',
        role: 'operator',
        email: 'sarah.jenkins@aidpath.org',
        badge: 'Operator / Staff',
        description: 'Verification Coordinator. Reviews stale records and audits deadline links.',
      },
      {
        id: '44444444-4444-4444-a444-444444444444',
        full_name: 'Dr. Arthur Vance',
        role: 'admin',
        email: 'arthur.vance@aidpath.org',
        badge: 'Administrator',
        description: 'Program Director. Curates awards, manages rules, inspects audit logs.',
      },
      {
        id: 'visitor',
        full_name: 'Public Visitor',
        role: 'visitor',
        email: 'visitor@aidpath.org',
        badge: 'Visitor',
        description: 'Unauthenticated public guest. Can browse directory and run quick match.',
      },
    ],
  });
});

/**
 * PUT /api/auth/profile
 * Update student profile (GPA, major, residency, income, demographics)
 */
router.put('/profile', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const updates = req.body;
  const now = new Date().toISOString();

  if (updates.gpa !== undefined) {
    const val = parseFloat(updates.gpa);
    if (isNaN(val) || val < 0.0 || val > 4.0) {
      return res.status(400).json({ success: false, error: { message: 'GPA must be between 0.00 and 4.00' } });
    }
  }

  if (isSupabaseConnected && supabase) {
    try {
      const updatePayload = {
        updated_at: now,
      };
      if (updates.full_name) updatePayload.full_name = updates.full_name;
      if (updates.gpa !== undefined) updatePayload.gpa = parseFloat(updates.gpa);
      if (updates.major !== undefined) updatePayload.major = updates.major;
      if (updates.degree_level !== undefined) updatePayload.degree_level = updates.degree_level;
      if (updates.residency_status !== undefined) updatePayload.residency_status = updates.residency_status;
      if (updates.state_of_residence !== undefined) updatePayload.state_of_residence = updates.state_of_residence;
      if (updates.household_income !== undefined) updatePayload.household_income = parseFloat(updates.household_income) || 0;
      if (updates.is_first_generation !== undefined) updatePayload.is_first_generation = Boolean(updates.is_first_generation);
      if (updates.is_military_connected !== undefined) updatePayload.is_military_connected = Boolean(updates.is_military_connected);
      if (Array.isArray(updates.demographic_tags)) updatePayload.demographic_tags = updates.demographic_tags;

      const { data: updatedSupabase, error: supaErr } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .single();

      if (!supaErr && updatedSupabase) {
        return res.json({
          success: true,
          data: updatedSupabase,
          message: 'Profile updated successfully in Supabase.',
        });
      }
    } catch (e) {
      console.warn('Supabase profile update warning:', e.message);
    }
  }

  const index = inMemoryDb.profiles.findIndex((p) => p.id === userId);

  if (index === -1) {
    return res.status(404).json({ success: false, error: { message: 'Profile not found' } });
  }

  const profile = inMemoryDb.profiles[index];

  if (updates.full_name) profile.full_name = updates.full_name;
  if (updates.gpa !== undefined) profile.gpa = parseFloat(updates.gpa);
  if (updates.major !== undefined) profile.major = updates.major;
  if (updates.degree_level !== undefined) profile.degree_level = updates.degree_level;
  if (updates.residency_status !== undefined) profile.residency_status = updates.residency_status;
  if (updates.state_of_residence !== undefined) profile.state_of_residence = updates.state_of_residence;
  if (updates.household_income !== undefined) profile.household_income = parseFloat(updates.household_income) || 0;
  if (updates.is_first_generation !== undefined) profile.is_first_generation = Boolean(updates.is_first_generation);
  if (updates.is_military_connected !== undefined) profile.is_military_connected = Boolean(updates.is_military_connected);
  if (Array.isArray(updates.demographic_tags)) profile.demographic_tags = updates.demographic_tags;

  profile.updated_at = now;
  inMemoryDb.profiles[index] = profile;

  res.json({
    success: true,
    data: profile,
    message: 'Profile updated successfully.',
  });
});

/**
 * POST /api/auth/register
 * Register a new applicant or user
 */
router.post('/register', (req, res) => {
  const { email, full_name, role = 'student', gpa = 3.5, major = 'Computer Science', degree_level = 'Undergraduate' } = req.body;

  if (!email || !full_name) {
    return res.status(400).json({
      success: false,
      error: { message: 'Email and Full Name are required.' },
    });
  }

  const existing = inMemoryDb.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({
      success: false,
      error: { message: 'An account with this email already exists. You can select it from the persona menu.' },
    });
  }

  const newProfile = {
    id: `usr-${Date.now()}`,
    email,
    full_name,
    role,
    gpa: parseFloat(gpa) || 3.0,
    major,
    degree_level,
    residency_status: req.body.residency_status || 'US Citizen',
    state_of_residence: req.body.state_of_residence || 'California',
    household_income: parseFloat(req.body.household_income) || 50000.0,
    is_first_generation: Boolean(req.body.is_first_generation),
    is_military_connected: Boolean(req.body.is_military_connected),
    demographic_tags: req.body.demographic_tags || ['Applicant'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  inMemoryDb.profiles.push(newProfile);

  res.status(201).json({
    success: true,
    data: newProfile,
    message: 'Account registered successfully.',
  });
});

export default router;
