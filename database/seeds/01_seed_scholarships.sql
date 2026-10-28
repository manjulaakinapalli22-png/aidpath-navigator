-- ==============================================================================
-- Scholarship Eligibility and Application Deadline Navigator
-- Seed Data: 01_seed_scholarships.sql
-- Realistic Synthetic Seed Data for Evaluators and Testing
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. SEED PROFILES
-- -----------------------------------------------------------------------------
INSERT INTO profiles (id, email, full_name, role, gpa, major, degree_level, residency_status, state_of_residence, household_income, is_first_generation, is_military_connected, demographic_tags)
VALUES 
    ('11111111-1111-4111-a111-111111111111', 'elena.rostova@university.edu', 'Elena Rostova', 'student', 3.82, 'Computer Science', 'Undergraduate', 'US Citizen', 'California', 48000.00, true, false, ARRAY['First-Generation College Student', 'Women in STEM', 'Pell Grant Eligible']),
    ('22222222-2222-4222-a222-222222222222', 'marcus.chen@highschool.edu', 'Marcus Chen', 'student', 3.40, 'Biology / Pre-Med', 'High School Senior', 'Permanent Resident', 'Texas', 72000.00, false, false, ARRAY['Asian American Scholar', 'Aspiring Healthcare Professional']),
    ('33333333-3333-4333-a333-333333333333', 'sarah.jenkins@aidpath.org', 'Sarah Jenkins', 'operator', 3.90, 'Higher Education Admin', 'Graduate', 'US Citizen', 'New York', 85000.00, true, false, ARRAY['Higher Ed Staff', 'Verification Specialist']),
    ('44444444-4444-4444-a444-444444444444', 'arthur.vance@aidpath.org', 'Dr. Arthur Vance', 'admin', 4.00, 'Public Policy', 'Doctorate', 'US Citizen', 'Washington DC', 120000.00, false, true, ARRAY['System Administrator', 'Program Director', 'Veteran Scholar'])
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    gpa = EXCLUDED.gpa,
    major = EXCLUDED.major,
    degree_level = EXCLUDED.degree_level,
    residency_status = EXCLUDED.residency_status,
    household_income = EXCLUDED.household_income;

-- -----------------------------------------------------------------------------
-- 2. SEED SCHOLARSHIPS
-- -----------------------------------------------------------------------------
INSERT INTO scholarships (
    id, title, provider_name, provider_url, description, award_amount, currency, is_renewable, renewable_details,
    education_levels, eligible_majors, min_gpa, residency_requirements, need_based, max_household_income,
    demographic_criteria, deadline, application_url, is_active, verification_status, last_verified_at,
    verified_by_id, verified_by_name, verification_notes, staleness_threshold_days
)
VALUES
    (
        'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1',
        'Ada Lovelace Women in Computing Leadership Grant',
        'National Computing Education Foundation',
        'https://example.org/foundations/ada-lovelace-award',
        'Empowering high-achieving undergraduate women pursuing degrees in Computer Science, Software Engineering, and AI research. Includes mentorship and conference sponsorship.',
        12500.00, 'USD', true, 'Renewable for up to 3 years contingent on maintaining 3.5+ GPA',
        ARRAY['Undergraduate'], ARRAY['Computer Science', 'Software Engineering', 'Data Science', 'Computer Engineering'],
        3.50, ARRAY['US Citizen', 'Permanent Resident', 'DACA / Undocumented'], false, NULL,
        ARRAY['Women in STEM'],
        NOW() + INTERVAL '12 days', 'https://example.org/apply/ada-lovelace',
        true, 'verified', NOW() - INTERVAL '5 days',
        '33333333-3333-4333-a333-333333333333', 'Sarah Jenkins', 'Confirmed updated portal guidelines and 2026 spring round deadline.', 90
    ),
    (
        'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2',
        'NextGen First-Generation College Pathway Award',
        'Apex Social Mobility Initiative',
        'https://example.org/apex-mobility/pathway',
        'Need-based award designed to relieve tuition burdens for first-generation university students demonstrated through academic resilience and community commitment.',
        7500.00, 'USD', false, 'One-time stipend deposited directly into student bursar account',
        ARRAY['High School Senior', 'Undergraduate'], ARRAY['All Majors'],
        2.75, ARRAY['US Citizen', 'Permanent Resident', 'Eligible Non-Citizen'], true, 65000.00,
        ARRAY['First-Generation College Student'],
        NOW() + INTERVAL '5 days', 'https://example.org/apply/nextgen-firstgen',
        true, 'verified', NOW() - INTERVAL '8 days',
        '33333333-3333-4333-a333-333333333333', 'Sarah Jenkins', 'Checked with program director; criteria confirmed current.', 90
    ),
    (
        'aaaaaaa3-aaaa-4aaa-aaaa-aaaaaaaaaaa3',
        'Horizon Global Health & Nursing Excellence Fellowship',
        'Alliance for Global Healthcare Education',
        'https://example.org/alliance-health/fellowship',
        'Full academic year support for undergraduate nursing and pre-medical scholars dedicated to serving underserved rural or urban primary care clinics.',
        15000.00, 'USD', true, 'Renewable for second clinical year with satisfactory progress',
        ARRAY['Undergraduate', 'Graduate'], ARRAY['Biology / Pre-Med', 'Nursing', 'Public Health', 'Health Sciences'],
        3.20, ARRAY['US Citizen', 'Permanent Resident'], false, NULL,
        ARRAY['Healthcare Scholars'],
        NOW() + INTERVAL '24 days', 'https://example.org/apply/horizon-health',
        true, 'verified', NOW() - INTERVAL '14 days',
        '33333333-3333-4333-a333-333333333333', 'Sarah Jenkins', 'Clinical rotation requirement verified.', 90
    ),
    (
        'aaaaaaa4-aaaa-4aaa-aaaa-aaaaaaaaaaa4',
        'Clean Energy & Environmental Innovation Bursary',
        'TerraVerde Sustainability Institute',
        'https://example.org/terraverde/clean-energy',
        'Grant funding for students exploring solar technology, grid optimization, climate policy, and environmental engineering research.',
        10000.00, 'USD', false, 'Includes $1,500 research laboratory materials allowance',
        ARRAY['Undergraduate', 'Graduate'], ARRAY['Engineering', 'Environmental Science', 'Physics', 'Computer Science'],
        3.00, ARRAY['US Citizen', 'Permanent Resident', 'International'], false, NULL,
        ARRAY['STEM Scholars'],
        NOW() + INTERVAL '45 days', 'https://example.org/apply/clean-energy',
        true, 'flagged_stale', NOW() - INTERVAL '112 days',
        NULL, 'Legacy System', 'Record exceeded 90-day threshold without manual re-verification. Source portal underwent redesign.', 90
    ),
    (
        'aaaaaaa5-aaaa-4aaa-aaaa-aaaaaaaaaaa5',
        'Heritage Civic Engagement & Public Policy Scholarship',
        'Beacon Freedom Trust',
        'https://example.org/beacon/civic-scholars',
        'Recognizing student leaders who have contributed over 100 hours of civic volunteering, student government, or non-profit community advocacy.',
        6000.00, 'USD', false, 'One-time award disbursed upon proof of enrollment',
        ARRAY['High School Senior', 'Undergraduate'], ARRAY['Political Science', 'Economics', 'History', 'All Majors'],
        3.00, ARRAY['US Citizen'], false, NULL,
        ARRAY['Civic Leaders'],
        NOW() + INTERVAL '18 days', 'https://example.org/apply/heritage-civic',
        true, 'flagged_stale', NOW() - INTERVAL '105 days',
        NULL, 'Legacy System', 'Stale record review required: deadline date needs verification against 2026 foundation catalog.', 90
    ),
    (
        'aaaaaaa6-aaaa-4aaa-aaaa-aaaaaaaaaaa6',
        'Future Technologists Diversity in AI Scholarship',
        'Silicon Valley Frontier Fund',
        'https://example.org/frontier/diversity-ai',
        'Dedicated to expanding representation in deep learning, machine learning, and robotics engineering for historically underrepresented backgrounds.',
        20000.00, 'USD', true, 'Renewable for 2 years + guaranteed summer research internship',
        ARRAY['Undergraduate', 'Graduate'], ARRAY['Computer Science', 'Data Science', 'Electrical Engineering', 'Robotics'],
        3.60, ARRAY['US Citizen', 'Permanent Resident', 'DACA / Undocumented'], true, 80000.00,
        ARRAY['Underrepresented Minorities in Tech', 'First-Generation College Student'],
        NOW() + INTERVAL '35 days', 'https://example.org/apply/diversity-ai',
        true, 'verified', NOW() - INTERVAL '2 days',
        '44444444-4444-4444-a444-444444444444', 'Dr. Arthur Vance', 'Direct partnership agreement signed with tech consortium.', 90
    ),
    (
        'aaaaaaa7-aaaa-4aaa-aaaa-aaaaaaaaaaa7',
        'Vanguard Community College Transfer Grant',
        'Higher Horizons Foundation',
        'https://example.org/horizons/transfer-grant',
        'Specialized bridge funding for community college students transferring to accredited 4-year public or private non-profit universities.',
        5000.00, 'USD', true, 'Renewable for senior year upon completing 30 credits',
        ARRAY['Undergraduate'], ARRAY['All Majors'],
        2.80, ARRAY['US Citizen', 'Permanent Resident'], true, 55000.00,
        ARRAY['Transfer Students', 'First-Generation College Student'],
        NOW() + INTERVAL '60 days', 'https://example.org/apply/vanguard-transfer',
        true, 'flagged_stale', NOW() - INTERVAL '98 days',
        NULL, 'Legacy System', 'Pending confirmation of minimum transfer credit threshold change.', 90
    ),
    (
        'aaaaaaa8-aaaa-4aaa-aaaa-aaaaaaaaaaa8',
        'National Veterans & Military Dependents Academic Fund',
        'Patriot Education Alliance',
        'https://example.org/patriot/military-dependents',
        'Providing supplemental educational assistance to active duty service members, military veterans, and their direct dependent spouses or children.',
        8500.00, 'USD', false, 'Direct tuition supplement compatible with GI Bill benefits',
        ARRAY['High School Senior', 'Undergraduate', 'Graduate'], ARRAY['All Majors'],
        2.50, ARRAY['US Citizen'], false, NULL,
        ARRAY['Military Veterans', 'Military Dependents'],
        NOW() + INTERVAL '75 days', 'https://example.org/apply/veterans-dependents',
        true, 'verified', NOW() - INTERVAL '10 days',
        '44444444-4444-4444-a444-444444444444', 'Dr. Arthur Vance', 'Veteran benefit coordination terms validated.', 90
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    award_amount = EXCLUDED.award_amount,
    deadline = EXCLUDED.deadline,
    verification_status = EXCLUDED.verification_status,
    last_verified_at = EXCLUDED.last_verified_at;

-- -----------------------------------------------------------------------------
-- 3. SEED SCHOLARSHIP REQUIREMENTS (Granular Rules)
-- -----------------------------------------------------------------------------
INSERT INTO scholarship_requirements (scholarship_id, requirement_type, rule_operator, rule_value, description, is_mandatory)
VALUES
    -- Ada Lovelace Grant Requirements
    ('aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1', 'gpa', 'gte', '3.50', 'Minimum cumulative GPA of 3.50 on a 4.0 scale', true),
    ('aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1', 'degree_level', 'in', 'Undergraduate', 'Currently enrolled as an Undergraduate student', true),
    ('aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1', 'major', 'in', 'Computer Science,Software Engineering,Data Science,Computer Engineering', 'Majoring in Computer Science or related computing discipline', true),
    ('aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1', 'demographic', 'contains', 'Women in STEM', 'Identifies as female or non-binary in technology fields', false),

    -- NextGen First-Gen Award Requirements
    ('aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2', 'first_gen', 'boolean', 'true', 'Must be a first-generation college student (neither parent completed 4-year degree)', true),
    ('aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2', 'gpa', 'gte', '2.75', 'Minimum cumulative GPA of 2.75', true),
    ('aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2', 'income', 'lte', '65000', 'Maximum household income of $65,000 (demonstrated financial need)', true),
    ('aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2', 'residency', 'in', 'US Citizen,Permanent Resident,Eligible Non-Citizen', 'US Citizen, Permanent Resident, or Eligible Non-Citizen', true),

    -- Horizon Healthcare Fellowship Requirements
    ('aaaaaaa3-aaaa-4aaa-aaaa-aaaaaaaaaaa3', 'major', 'in', 'Biology / Pre-Med,Nursing,Public Health,Health Sciences', 'Pursuing Pre-Medicine, Nursing, or Allied Health', true),
    ('aaaaaaa3-aaaa-4aaa-aaaa-aaaaaaaaaaa3', 'gpa', 'gte', '3.20', 'Minimum cumulative GPA of 3.20', true),
    ('aaaaaaa3-aaaa-4aaa-aaaa-aaaaaaaaaaa3', 'degree_level', 'in', 'Undergraduate,Graduate', 'Undergraduate upperclassman or graduate medical student', true),

    -- Clean Energy Bursary Requirements
    ('aaaaaaa4-aaaa-4aaa-aaaa-aaaaaaaaaaa4', 'major', 'in', 'Engineering,Environmental Science,Physics,Computer Science', 'Enrolled in STEM or Sustainability disciplines', true),
    ('aaaaaaa4-aaaa-4aaa-aaaa-aaaaaaaaaaa4', 'gpa', 'gte', '3.00', 'Minimum cumulative GPA of 3.00', true),

    -- Future Technologists AI Scholarship Requirements
    ('aaaaaaa6-aaaa-4aaa-aaaa-aaaaaaaaaaa6', 'gpa', 'gte', '3.60', 'High academic achievement with 3.60+ GPA', true),
    ('aaaaaaa6-aaaa-4aaa-aaaa-aaaaaaaaaaa6', 'major', 'in', 'Computer Science,Data Science,Electrical Engineering,Robotics', 'CS, AI, Data Science or Robotics focus', true),
    ('aaaaaaa6-aaaa-4aaa-aaaa-aaaaaaaaaaa6', 'income', 'lte', '80000', 'Demonstrated financial need (Household income <= $80k)', true)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 4. SEED REQUIRED DOCUMENTS (Checklist Templates)
-- -----------------------------------------------------------------------------
INSERT INTO scholarship_documents (id, scholarship_id, document_type, name, description, is_mandatory, suggested_lead_time_days)
VALUES
    ('bbbbbbb1-bbbb-4bbb-bbbb-bbbbbbbbbbb1', 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1', 'transcript', 'Official University Transcript', 'Up-to-date official electronic PDF transcript showing fall semester grades', true, 10),
    ('bbbbbbb2-bbbb-4bbb-bbbb-bbbbbbbbbbb2', 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1', 'recommendation_letter', 'Academic Recommendation Letter', 'From a faculty member or research advisor in computing/engineering', true, 14),
    ('bbbbbbb3-bbbb-4bbb-bbbb-bbbbbbbbbbb3', 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1', 'personal_statement', 'Technical Leadership Essay (750 words)', 'Describe your career vision, technical contributions, and impact on inclusive tech', true, 7),
    ('bbbbbbb4-bbbb-4bbb-bbbb-bbbbbbbbbbb4', 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1', 'resume_cv', 'Technical Resume / GitHub Portfolio', 'Listing recent projects, open-source work, or campus leadership', false, 3),

    ('bbbbbbb5-bbbb-4bbb-bbbb-bbbbbbbbbbb5', 'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2', 'fafsa_sar', 'FAFSA Student Aid Report (SAR)', 'Official SAR showing Student Aid Index (SAI) or EFC verification', true, 5),
    ('bbbbbbb6-bbbb-4bbb-bbbb-bbbbbbbbbbb6', 'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2', 'personal_statement', 'First-Gen Resilience Statement (500 words)', 'Reflections on being the first in family to navigate higher education', true, 7),
    ('bbbbbbb7-bbbb-4bbb-bbbb-bbbbbbbbbbb7', 'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2', 'recommendation_letter', 'Community or Counselor Reference', 'Letter testifying to your perseverance and academic dedication', true, 14),

    ('bbbbbbb8-bbbb-4bbb-bbbb-bbbbbbbbbbb8', 'aaaaaaa3-aaaa-4aaa-aaaa-aaaaaaaaaaa3', 'transcript', 'Official College Transcript', 'Cumulative transcript validating required biology/chemistry coursework', true, 10),
    ('bbbbbbb9-bbbb-4bbb-bbbb-bbbbbbbbbbb9', 'aaaaaaa3-aaaa-4aaa-aaaa-aaaaaaaaaaa3', 'essay', 'Clinical Philosophy & Underserved Care Essay', 'Explaining commitment to primary care in underserved populations', true, 7),
    ('bbbbbbba-bbbb-4bbb-bbbb-bbbbbbbbbbba', 'aaaaaaa3-aaaa-4aaa-aaaa-aaaaaaaaaaa3', 'recommendation_letter', 'Clinical Preceptor or Professor Recommendation', 'Evaluating patient interaction and ethical aptitude', true, 14)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5. SEED SAVED OPPORTUNITIES & ACTIVE CHECKLISTS (For Student Elena)
-- -----------------------------------------------------------------------------
INSERT INTO saved_scholarships (id, user_id, scholarship_id, stage, target_deadline, notes, award_amount_won)
VALUES
    (
        'ccccccc1-cccc-4ccc-cccc-cccccccccccc',
        '11111111-1111-4111-a111-111111111111',
        'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1',
        'preparing',
        NOW() + INTERVAL '12 days',
        'Primary top choice! Need to request letter from Prof. Williams by Friday.',
        0.00
    ),
    (
        'ccccccc2-cccc-4ccc-cccc-cccccccccccc',
        '11111111-1111-4111-a111-111111111111',
        'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2',
        'submitted',
        NOW() + INTERVAL '5 days',
        'Submitted on Feb 10th. Received confirmation receipt #APX-9821.',
        0.00
    ),
    (
        'ccccccc3-cccc-4ccc-cccc-cccccccccccc',
        '11111111-1111-4111-a111-111111111111',
        'aaaaaaa6-aaaa-4aaa-aaaa-aaaaaaaaaaa6',
        'considering',
        NOW() + INTERVAL '35 days',
        'High award amount ($20,000). AI research proposal required.',
        0.00
    )
ON CONFLICT (id) DO NOTHING;

-- Seed checklist items for Elena's preparing application (Ada Lovelace)
INSERT INTO application_checklists (saved_scholarship_id, document_id, status, file_name, notes)
VALUES
    ('ccccccc1-cccc-4ccc-cccc-cccccccccccc', 'bbbbbbb1-bbbb-4bbb-bbbb-bbbbbbbbbbb1', 'ready', 'Elena_Rostova_Official_Transcript_2026.pdf', 'Downloaded from registrar portal on Monday.'),
    ('ccccccc1-cccc-4ccc-cccc-cccccccccccc', 'bbbbbbb2-bbbb-4bbb-bbbb-bbbbbbbbbbb2', 'in_progress', NULL, 'Dr. Williams confirmed she is drafting it this week.'),
    ('ccccccc1-cccc-4ccc-cccc-cccccccccccc', 'bbbbbbb3-bbbb-4bbb-bbbb-bbbbbbbbbbb3', 'in_progress', 'Leadership_Essay_Draft_v2.docx', 'Second draft finished; revising opening paragraph.'),
    ('ccccccc1-cccc-4ccc-cccc-cccccccccccc', 'bbbbbbb4-bbbb-4bbb-bbbb-bbbbbbbbbbb4', 'missing', NULL, 'Need to update resume with latest ACM hackathon project.')
ON CONFLICT DO NOTHING;

-- Seed checklist items for Elena's submitted application (NextGen First-Gen)
INSERT INTO application_checklists (saved_scholarship_id, document_id, status, file_name, notes)
VALUES
    ('ccccccc2-cccc-4ccc-cccc-cccccccccccc', 'bbbbbbb5-bbbb-4bbb-bbbb-bbbbbbbbbbb5', 'submitted', 'FAFSA_SAR_2025_2026_ElenaRostova.pdf', 'SAI calculated at -1500 (Pell eligible)'),
    ('ccccccc2-cccc-4ccc-cccc-cccccccccccc', 'bbbbbbb6-bbbb-4bbb-bbbb-bbbbbbbbbbb6', 'submitted', 'FirstGen_Resilience_Final.pdf', 'Proofread by writing center.'),
    ('ccccccc2-cccc-4ccc-cccc-cccccccccccc', 'bbbbbbb7-bbbb-4bbb-bbbb-bbbbbbbbbbb7', 'submitted', 'Counselor_Reference_Letter.pdf', 'Uploaded directly by counselor.')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. SEED AUDIT LOGS
-- -----------------------------------------------------------------------------
INSERT INTO audit_logs (entity_type, entity_id, action, actor_id, actor_name, actor_role, details)
VALUES
    ('scholarship', 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1', 'VERIFY_RECORD', '33333333-3333-4333-a333-333333333333', 'Sarah Jenkins', 'operator', '{"note": "Verified 2026 application cycle and verified live portal URL."}'::jsonb),
    ('scholarship', 'aaaaaaa4-aaaa-4aaa-aaaa-aaaaaaaaaaa4', 'FLAG_STALE', NULL, 'System Scheduler', 'system', '{"days_unverified": 112, "reason": "Exceeded 90-day verification SLA threshold."}'::jsonb),
    ('saved_scholarship', 'ccccccc2-cccc-4ccc-cccc-cccccccccccc', 'STAGE_TRANSITION', '11111111-1111-4111-a111-111111111111', 'Elena Rostova', 'student', '{"from_stage": "preparing", "to_stage": "submitted"}'::jsonb);
