import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

let supabase = null;
let isSupabaseConnected = false;

// Initialize Supabase Client if URL and Key are available
if (config.supabaseUrl && (config.supabaseServiceKey || config.supabaseKey)) {
  try {
    const key = config.supabaseServiceKey || config.supabaseKey;
    supabase = createClient(config.supabaseUrl, key, {
      auth: { persistSession: false },
    });
    console.log(`[Supabase] Initialized client for ${config.supabaseUrl}`);
    // Check initial connection
    const { data, error } = await supabase.from('scholarships').select('id').limit(1);
    if (!error) {
      isSupabaseConnected = true;
      console.log('✅ [Supabase] Connected to live Supabase PostgreSQL database!');
    } else {
      console.warn('⚠️ [Supabase] Initial query returned:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase] Initialization warning:', err.message);
  }
}

/**
 * In-memory fallback repository initialized with realistic synthetic seed data.
 * Used when Supabase credentials are not provided or remote database is unreachable.
 */
class InMemoryRepository {
  constructor() {
    this.profiles = [];
    this.scholarships = [];
    this.scholarshipRequirements = [];
    this.scholarshipDocuments = [];
    this.savedScholarships = [];
    this.applicationChecklists = [];
    this.verificationReviews = [];
    this.auditLogs = [];
    this.initSeedData();
  }

  initSeedData() {
    const now = new Date();
    const daysFromNow = (days) => new Date(now.getTime() + days * 86400000).toISOString();
    const daysAgo = (days) => new Date(now.getTime() - days * 86400000).toISOString();

    // 1. Profiles
    this.profiles = [
      {
        id: '11111111-1111-4111-a111-111111111111',
        email: 'elena.rostova@university.edu',
        full_name: 'Elena Rostova',
        role: 'student',
        gpa: 3.82,
        major: 'Computer Science',
        degree_level: 'Undergraduate',
        residency_status: 'US Citizen',
        state_of_residence: 'California',
        household_income: 48000.0,
        is_first_generation: true,
        is_military_connected: false,
        demographic_tags: ['First-Generation College Student', 'Women in STEM', 'Pell Grant Eligible'],
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        created_at: daysAgo(30),
        updated_at: daysAgo(2),
      },
      {
        id: '22222222-2222-4222-a222-222222222222',
        email: 'marcus.chen@highschool.edu',
        full_name: 'Marcus Chen',
        role: 'student',
        gpa: 3.4,
        major: 'Biology / Pre-Med',
        degree_level: 'High School Senior',
        residency_status: 'Permanent Resident',
        state_of_residence: 'Texas',
        household_income: 72000.0,
        is_first_generation: false,
        is_military_connected: false,
        demographic_tags: ['Asian American Scholar', 'Aspiring Healthcare Professional'],
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        created_at: daysAgo(20),
        updated_at: daysAgo(5),
      },
      {
        id: '33333333-3333-4333-a333-333333333333',
        email: 'sarah.jenkins@aidpath.org',
        full_name: 'Sarah Jenkins',
        role: 'operator',
        gpa: 3.9,
        major: 'Higher Education Admin',
        degree_level: 'Graduate',
        residency_status: 'US Citizen',
        state_of_residence: 'New York',
        household_income: 85000.0,
        is_first_generation: true,
        is_military_connected: false,
        demographic_tags: ['Higher Ed Staff', 'Verification Specialist'],
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        created_at: daysAgo(100),
        updated_at: daysAgo(1),
      },
      {
        id: '44444444-4444-4444-a444-444444444444',
        email: 'arthur.vance@aidpath.org',
        full_name: 'Dr. Arthur Vance',
        role: 'admin',
        gpa: 4.0,
        major: 'Public Policy',
        degree_level: 'Doctorate',
        residency_status: 'US Citizen',
        state_of_residence: 'Washington DC',
        household_income: 120000.0,
        is_first_generation: false,
        is_military_connected: true,
        demographic_tags: ['System Administrator', 'Program Director', 'Veteran Scholar'],
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        created_at: daysAgo(200),
        updated_at: daysAgo(1),
      },
    ];

    // 2. Scholarships
    this.scholarships = [
      {
        id: 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1',
        title: 'Ada Lovelace Women in Computing Leadership Grant',
        provider_name: 'National Computing Education Foundation',
        provider_url: 'https://example.org/foundations/ada-lovelace-award',
        description:
          'Empowering high-achieving undergraduate women pursuing degrees in Computer Science, Software Engineering, and AI research. Includes $12,500 funding, mentor pairing, and registration for the Grace Hopper Celebration.',
        award_amount: 12500.0,
        currency: 'USD',
        is_renewable: true,
        renewable_details: 'Renewable for up to 3 years contingent on maintaining a 3.50+ cumulative GPA.',
        education_levels: ['Undergraduate'],
        eligible_majors: ['Computer Science', 'Software Engineering', 'Data Science', 'Computer Engineering'],
        min_gpa: 3.5,
        residency_requirements: ['US Citizen', 'Permanent Resident', 'DACA / Undocumented'],
        need_based: false,
        max_household_income: null,
        demographic_criteria: ['Women in STEM'],
        deadline: daysFromNow(12),
        application_url: 'https://example.org/apply/ada-lovelace',
        is_active: true,
        verification_status: 'verified',
        last_verified_at: daysAgo(5),
        verified_by_id: '33333333-3333-4333-a333-333333333333',
        verified_by_name: 'Sarah Jenkins',
        verification_notes: 'Confirmed 2026 spring round deadline and application portal rubric.',
        staleness_threshold_days: 90,
        created_at: daysAgo(120),
        updated_at: daysAgo(5),
      },
      {
        id: 'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2',
        title: 'NextGen First-Generation College Pathway Award',
        provider_name: 'Apex Social Mobility Initiative',
        provider_url: 'https://example.org/apex-mobility/pathway',
        description:
          'Direct grant funding aimed at reducing the financial burden on first-generation college students who demonstrate academic grit, community involvement, and clear leadership potential.',
        award_amount: 7500.0,
        currency: 'USD',
        is_renewable: false,
        renewable_details: 'One-time stipend credited directly toward tuition and instructional materials.',
        education_levels: ['High School Senior', 'Undergraduate'],
        eligible_majors: ['All Majors'],
        min_gpa: 2.75,
        residency_requirements: ['US Citizen', 'Permanent Resident', 'Eligible Non-Citizen'],
        need_based: true,
        max_household_income: 65000.0,
        demographic_criteria: ['First-Generation College Student'],
        deadline: daysFromNow(5),
        application_url: 'https://example.org/apply/nextgen-firstgen',
        is_active: true,
        verification_status: 'verified',
        last_verified_at: daysAgo(8),
        verified_by_id: '33333333-3333-4333-a333-333333333333',
        verified_by_name: 'Sarah Jenkins',
        verification_notes: 'Spoke directly with scholarship committee lead; income threshold confirmed.',
        staleness_threshold_days: 90,
        created_at: daysAgo(90),
        updated_at: daysAgo(8),
      },
      {
        id: 'aaaaaaa3-aaaa-4aaa-aaaa-aaaaaaaaaaa3',
        title: 'Horizon Global Health & Nursing Excellence Fellowship',
        provider_name: 'Alliance for Global Healthcare Education',
        provider_url: 'https://example.org/alliance-health/fellowship',
        description:
          'Comprehensive tuition assistance for students pursuing careers in nursing, clinical medicine, and public health with a dedication to serving rural or underserved community clinics.',
        award_amount: 15000.0,
        currency: 'USD',
        is_renewable: true,
        renewable_details: 'Renewable for a 2nd year upon completion of 60 clinical rotation hours.',
        education_levels: ['Undergraduate', 'Graduate'],
        eligible_majors: ['Biology / Pre-Med', 'Nursing', 'Public Health', 'Health Sciences'],
        min_gpa: 3.2,
        residency_requirements: ['US Citizen', 'Permanent Resident'],
        need_based: false,
        max_household_income: null,
        demographic_criteria: ['Healthcare Scholars'],
        deadline: daysFromNow(24),
        application_url: 'https://example.org/apply/horizon-health',
        is_active: true,
        verification_status: 'verified',
        last_verified_at: daysAgo(14),
        verified_by_id: '33333333-3333-4333-a333-333333333333',
        verified_by_name: 'Sarah Jenkins',
        verification_notes: 'Clinical placement pre-requisites verified against latest accreditation guide.',
        staleness_threshold_days: 90,
        created_at: daysAgo(80),
        updated_at: daysAgo(14),
      },
      {
        id: 'aaaaaaa4-aaaa-4aaa-aaaa-aaaaaaaaaaa4',
        title: 'Clean Energy & Environmental Innovation Bursary',
        provider_name: 'TerraVerde Sustainability Institute',
        provider_url: 'https://example.org/terraverde/clean-energy',
        description:
          'Grant funding for students exploring solar technology, grid optimization, climate policy, and environmental engineering research.',
        award_amount: 10000.0,
        currency: 'USD',
        is_renewable: false,
        renewable_details: 'Includes a $1,500 laboratory materials and experimental budget.',
        education_levels: ['Undergraduate', 'Graduate'],
        eligible_majors: ['Engineering', 'Environmental Science', 'Physics', 'Computer Science'],
        min_gpa: 3.0,
        residency_requirements: ['US Citizen', 'Permanent Resident', 'International'],
        need_based: false,
        max_household_income: null,
        demographic_criteria: ['STEM Scholars'],
        deadline: daysFromNow(45),
        application_url: 'https://example.org/apply/clean-energy',
        is_active: true,
        verification_status: 'flagged_stale',
        last_verified_at: daysAgo(112),
        verified_by_id: null,
        verified_by_name: 'Automated Bot / Legacy',
        verification_notes:
          'Record exceeded 90-day verification SLA. TerraVerde redesigned website; operator review required.',
        staleness_threshold_days: 90,
        created_at: daysAgo(140),
        updated_at: daysAgo(112),
      },
      {
        id: 'aaaaaaa5-aaaa-4aaa-aaaa-aaaaaaaaaaa5',
        title: 'Heritage Civic Engagement & Public Policy Scholarship',
        provider_name: 'Beacon Freedom Trust',
        provider_url: 'https://example.org/beacon/civic-scholars',
        description:
          'Recognizing student leaders who have contributed over 100 hours of documented community volunteering, civic organizing, or public policy research.',
        award_amount: 6000.0,
        currency: 'USD',
        is_renewable: false,
        renewable_details: 'Single installment paid in autumn semester.',
        education_levels: ['High School Senior', 'Undergraduate'],
        eligible_majors: ['Political Science', 'Economics', 'History', 'All Majors'],
        min_gpa: 3.0,
        residency_requirements: ['US Citizen'],
        need_based: false,
        max_household_income: null,
        demographic_criteria: ['Civic Leaders'],
        deadline: daysFromNow(18),
        application_url: 'https://example.org/apply/heritage-civic',
        is_active: true,
        verification_status: 'flagged_stale',
        last_verified_at: daysAgo(105),
        verified_by_id: null,
        verified_by_name: 'Automated Bot / Legacy',
        verification_notes:
          'Unverified for 105 days. Need staff confirmation on whether civic hour verification letter is still physical or digital.',
        staleness_threshold_days: 90,
        created_at: daysAgo(130),
        updated_at: daysAgo(105),
      },
      {
        id: 'aaaaaaa6-aaaa-4aaa-aaaa-aaaaaaaaaaa6',
        title: 'Future Technologists Diversity in AI Scholarship',
        provider_name: 'Silicon Valley Frontier Fund',
        provider_url: 'https://example.org/frontier/diversity-ai',
        description:
          'Dedicated to expanding representation in deep learning, machine learning, and robotics engineering for historically underrepresented backgrounds.',
        award_amount: 20000.0,
        currency: 'USD',
        is_renewable: true,
        renewable_details: 'Renewable for 2 consecutive years plus guaranteed summer AI research internship.',
        education_levels: ['Undergraduate', 'Graduate'],
        eligible_majors: ['Computer Science', 'Data Science', 'Electrical Engineering', 'Robotics'],
        min_gpa: 3.6,
        residency_requirements: ['US Citizen', 'Permanent Resident', 'DACA / Undocumented'],
        need_based: true,
        max_household_income: 80000.0,
        demographic_criteria: ['Underrepresented Minorities in Tech', 'First-Generation College Student'],
        deadline: daysFromNow(35),
        application_url: 'https://example.org/apply/diversity-ai',
        is_active: true,
        verification_status: 'verified',
        last_verified_at: daysAgo(2),
        verified_by_id: '44444444-4444-4444-a444-444444444444',
        verified_by_name: 'Dr. Arthur Vance',
        verification_notes: 'Direct institutional agreement validated with 2026 award schedule.',
        staleness_threshold_days: 90,
        created_at: daysAgo(60),
        updated_at: daysAgo(2),
      },
      {
        id: 'aaaaaaa7-aaaa-4aaa-aaaa-aaaaaaaaaaa7',
        title: 'Vanguard Community College Transfer Grant',
        provider_name: 'Higher Horizons Foundation',
        provider_url: 'https://example.org/horizons/transfer-grant',
        description:
          'Specialized bridge funding for community college students transferring to accredited 4-year public or private universities.',
        award_amount: 5000.0,
        currency: 'USD',
        is_renewable: true,
        renewable_details: 'Renewable for senior year upon completing 30 credits.',
        education_levels: ['Undergraduate'],
        eligible_majors: ['All Majors'],
        min_gpa: 2.8,
        residency_requirements: ['US Citizen', 'Permanent Resident'],
        need_based: true,
        max_household_income: 55000.0,
        demographic_criteria: ['Transfer Students', 'First-Generation College Student'],
        deadline: daysFromNow(60),
        application_url: 'https://example.org/apply/vanguard-transfer',
        is_active: true,
        verification_status: 'flagged_stale',
        last_verified_at: daysAgo(98),
        verified_by_id: null,
        verified_by_name: 'Automated Bot / Legacy',
        verification_notes: 'Exceeded 90 days. Check minimum transfer unit requirement (30 vs 45 units).',
        staleness_threshold_days: 90,
        created_at: daysAgo(110),
        updated_at: daysAgo(98),
      },
      {
        id: 'aaaaaaa8-aaaa-4aaa-aaaa-aaaaaaaaaaa8',
        title: 'National Veterans & Military Dependents Academic Fund',
        provider_name: 'Patriot Education Alliance',
        provider_url: 'https://example.org/patriot/military-dependents',
        description:
          'Providing supplemental educational assistance to active duty service members, military veterans, and their direct dependent spouses or children.',
        award_amount: 8500.0,
        currency: 'USD',
        is_renewable: false,
        renewable_details: 'Direct tuition supplement compatible with GI Bill benefits.',
        education_levels: ['High School Senior', 'Undergraduate', 'Graduate'],
        eligible_majors: ['All Majors'],
        min_gpa: 2.5,
        residency_requirements: ['US Citizen'],
        need_based: false,
        max_household_income: null,
        demographic_criteria: ['Military Veterans', 'Military Dependents'],
        deadline: daysFromNow(75),
        application_url: 'https://example.org/apply/veterans-dependents',
        is_active: true,
        verification_status: 'verified',
        last_verified_at: daysAgo(10),
        verified_by_id: '44444444-4444-4444-a444-444444444444',
        verified_by_name: 'Dr. Arthur Vance',
        verification_notes: 'Veteran benefit coordination terms validated.',
        staleness_threshold_days: 90,
        created_at: daysAgo(50),
        updated_at: daysAgo(10),
      },
    ];

    // 3. Scholarship Requirements
    this.scholarshipRequirements = [
      // Ada Lovelace
      {
        id: 'req-1',
        scholarship_id: 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1',
        requirement_type: 'gpa',
        rule_operator: 'gte',
        rule_value: '3.50',
        description: 'Cumulative GPA of 3.50 or higher',
        is_mandatory: true,
      },
      {
        id: 'req-2',
        scholarship_id: 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1',
        requirement_type: 'degree_level',
        rule_operator: 'in',
        rule_value: 'Undergraduate',
        description: 'Enrolled as an Undergraduate college student',
        is_mandatory: true,
      },
      {
        id: 'req-3',
        scholarship_id: 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1',
        requirement_type: 'major',
        rule_operator: 'in',
        rule_value: 'Computer Science,Software Engineering,Data Science,Computer Engineering',
        description: 'Pursuing a major in Computer Science or related software discipline',
        is_mandatory: true,
      },
      {
        id: 'req-4',
        scholarship_id: 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1',
        requirement_type: 'demographic',
        rule_operator: 'contains',
        rule_value: 'Women in STEM',
        description: 'Identifies as a female or non-binary scholar in STEM',
        is_mandatory: false,
      },

      // NextGen First-Gen
      {
        id: 'req-5',
        scholarship_id: 'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2',
        requirement_type: 'first_gen',
        rule_operator: 'boolean',
        rule_value: 'true',
        description: 'First-generation college student (neither parent earned 4-year degree)',
        is_mandatory: true,
      },
      {
        id: 'req-6',
        scholarship_id: 'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2',
        requirement_type: 'gpa',
        rule_operator: 'gte',
        rule_value: '2.75',
        description: 'Minimum cumulative GPA of 2.75',
        is_mandatory: true,
      },
      {
        id: 'req-7',
        scholarship_id: 'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2',
        requirement_type: 'income',
        rule_operator: 'lte',
        rule_value: '65000',
        description: 'Household income at or below $65,000/year',
        is_mandatory: true,
      },
      {
        id: 'req-8',
        scholarship_id: 'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2',
        requirement_type: 'residency',
        rule_operator: 'in',
        rule_value: 'US Citizen,Permanent Resident,Eligible Non-Citizen',
        description: 'US Citizen, Permanent Resident, or Eligible Non-Citizen status',
        is_mandatory: true,
      },

      // Horizon Health
      {
        id: 'req-9',
        scholarship_id: 'aaaaaaa3-aaaa-4aaa-aaaa-aaaaaaaaaaa3',
        requirement_type: 'major',
        rule_operator: 'in',
        rule_value: 'Biology / Pre-Med,Nursing,Public Health,Health Sciences',
        description: 'Majoring in Pre-Medicine, Nursing, or allied health fields',
        is_mandatory: true,
      },
      {
        id: 'req-10',
        scholarship_id: 'aaaaaaa3-aaaa-4aaa-aaaa-aaaaaaaaaaa3',
        requirement_type: 'gpa',
        rule_operator: 'gte',
        rule_value: '3.20',
        description: 'Minimum cumulative GPA of 3.20',
        is_mandatory: true,
      },
      {
        id: 'req-11',
        scholarship_id: 'aaaaaaa3-aaaa-4aaa-aaaa-aaaaaaaaaaa3',
        requirement_type: 'degree_level',
        rule_operator: 'in',
        rule_value: 'Undergraduate,Graduate',
        description: 'Undergraduate or Graduate level',
        is_mandatory: true,
      },

      // Clean Energy
      {
        id: 'req-12',
        scholarship_id: 'aaaaaaa4-aaaa-4aaa-aaaa-aaaaaaaaaaa4',
        requirement_type: 'major',
        rule_operator: 'in',
        rule_value: 'Engineering,Environmental Science,Physics,Computer Science',
        description: 'STEM or Environmental disciplines',
        is_mandatory: true,
      },
      {
        id: 'req-13',
        scholarship_id: 'aaaaaaa4-aaaa-4aaa-aaaa-aaaaaaaaaaa4',
        requirement_type: 'gpa',
        rule_operator: 'gte',
        rule_value: '3.00',
        description: 'Cumulative GPA of 3.00+',
        is_mandatory: true,
      },

      // Future Technologists AI
      {
        id: 'req-14',
        scholarship_id: 'aaaaaaa6-aaaa-4aaa-aaaa-aaaaaaaaaaa6',
        requirement_type: 'gpa',
        rule_operator: 'gte',
        rule_value: '3.60',
        description: 'Cumulative GPA of 3.60 or higher',
        is_mandatory: true,
      },
      {
        id: 'req-15',
        scholarship_id: 'aaaaaaa6-aaaa-4aaa-aaaa-aaaaaaaaaaa6',
        requirement_type: 'major',
        rule_operator: 'in',
        rule_value: 'Computer Science,Data Science,Electrical Engineering,Robotics',
        description: 'Advanced computing, robotics, or AI major',
        is_mandatory: true,
      },
      {
        id: 'req-16',
        scholarship_id: 'aaaaaaa6-aaaa-4aaa-aaaa-aaaaaaaaaaa6',
        requirement_type: 'income',
        rule_operator: 'lte',
        rule_value: '80000',
        description: 'Demonstrated financial need (Household income <= $80k)',
        is_mandatory: true,
      },

      // Military Dependents
      {
        id: 'req-17',
        scholarship_id: 'aaaaaaa8-aaaa-4aaa-aaaa-aaaaaaaaaaa8',
        requirement_type: 'military',
        rule_operator: 'boolean',
        rule_value: 'true',
        description: 'Active military service member, veteran, or eligible dependent',
        is_mandatory: true,
      },
      {
        id: 'req-18',
        scholarship_id: 'aaaaaaa8-aaaa-4aaa-aaaa-aaaaaaaaaaa8',
        requirement_type: 'gpa',
        rule_operator: 'gte',
        rule_value: '2.50',
        description: 'Minimum 2.50 GPA',
        is_mandatory: true,
      },
    ];

    // 4. Scholarship Documents
    this.scholarshipDocuments = [
      {
        id: 'bbbbbbb1-bbbb-4bbb-bbbb-bbbbbbbbbbb1',
        scholarship_id: 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1',
        document_type: 'transcript',
        name: 'Official University Transcript',
        description: 'PDF transcript displaying latest cumulative GPA and computer science coursework.',
        is_mandatory: true,
        suggested_lead_time_days: 10,
      },
      {
        id: 'bbbbbbb2-bbbb-4bbb-bbbb-bbbbbbbbbbb2',
        scholarship_id: 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1',
        document_type: 'recommendation_letter',
        name: 'STEM Faculty Recommendation Letter',
        description: 'Letter from a computer science or engineering professor attesting to technical ability.',
        is_mandatory: true,
        suggested_lead_time_days: 14,
      },
      {
        id: 'bbbbbbb3-bbbb-4bbb-bbbb-bbbbbbbbbbb3',
        scholarship_id: 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1',
        document_type: 'personal_statement',
        name: 'Technical Vision Essay (750 words)',
        description: 'Explain your computing journey and plan to promote inclusivity in technology.',
        is_mandatory: true,
        suggested_lead_time_days: 7,
      },
      {
        id: 'bbbbbbb4-bbbb-4bbb-bbbb-bbbbbbbbbbb4',
        scholarship_id: 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1',
        document_type: 'resume_cv',
        name: 'Technical Resume / GitHub Portfolio',
        description: 'Showcase recent software projects, hackathons, or open source contributions.',
        is_mandatory: false,
        suggested_lead_time_days: 3,
      },

      // NextGen First-Gen Docs
      {
        id: 'bbbbbbb5-bbbb-4bbb-bbbb-bbbbbbbbbbb5',
        scholarship_id: 'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2',
        document_type: 'fafsa_sar',
        name: 'FAFSA Student Aid Report (SAR)',
        description: 'Official federal SAR demonstrating Student Aid Index (SAI) and Pell eligibility.',
        is_mandatory: true,
        suggested_lead_time_days: 5,
      },
      {
        id: 'bbbbbbb6-bbbb-4bbb-bbbb-bbbbbbbbbbb6',
        scholarship_id: 'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2',
        document_type: 'personal_statement',
        name: 'First-Gen Resilience Statement (500 words)',
        description: 'Personal reflection on navigating university challenges as a first-gen student.',
        is_mandatory: true,
        suggested_lead_time_days: 7,
      },
      {
        id: 'bbbbbbb7-bbbb-4bbb-bbbb-bbbbbbbbbbb7',
        scholarship_id: 'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2',
        document_type: 'recommendation_letter',
        name: 'Counselor or Community Mentor Letter',
        description: 'Endorsement highlighting perseverance and character.',
        is_mandatory: true,
        suggested_lead_time_days: 14,
      },

      // Horizon Health Docs
      {
        id: 'bbbbbbb8-bbbb-4bbb-bbbb-bbbbbbbbbbb8',
        scholarship_id: 'aaaaaaa3-aaaa-4aaa-aaaa-aaaaaaaaaaa3',
        document_type: 'transcript',
        name: 'Pre-Med / Nursing Transcript',
        description: 'Demonstrating science prerequisites (Biology, Chem, Anatomy).',
        is_mandatory: true,
        suggested_lead_time_days: 10,
      },
      {
        id: 'bbbbbbb9-bbbb-4bbb-bbbb-bbbbbbbbbbb9',
        scholarship_id: 'aaaaaaa3-aaaa-4aaa-aaaa-aaaaaaaaaaa3',
        document_type: 'essay',
        name: 'Underserved Community Care Essay',
        description: 'Why you plan to practice in rural or medically underserved communities.',
        is_mandatory: true,
        suggested_lead_time_days: 7,
      },

      // Future Tech Docs
      {
        id: 'bbbbbbba-bbbb-4bbb-bbbb-bbbbbbbbbbba',
        scholarship_id: 'aaaaaaa6-aaaa-4aaa-aaaa-aaaaaaaaaaa6',
        document_type: 'personal_statement',
        name: 'AI Impact & Ethics Essay',
        description: 'Exploring an AI problem you intend to solve with ethical grounding.',
        is_mandatory: true,
        suggested_lead_time_days: 8,
      },
      {
        id: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
        scholarship_id: 'aaaaaaa6-aaaa-4aaa-aaaa-aaaaaaaaaaa6',
        document_type: 'financial_proof',
        name: 'Proof of Need / Tax Form W-2',
        description: 'Verifying family household income under $80,000.',
        is_mandatory: true,
        suggested_lead_time_days: 6,
      },
    ];

    // 5. Saved Scholarships (Elena's Pipeline)
    this.savedScholarships = [
      {
        id: 'ccccccc1-cccc-4ccc-cccc-cccccccccccc',
        user_id: '11111111-1111-4111-a111-111111111111',
        scholarship_id: 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1',
        stage: 'preparing',
        target_deadline: daysFromNow(12),
        notes: 'Primary top choice! Need to request letter from Prof. Williams by Friday.',
        award_amount_won: 0.0,
        created_at: daysAgo(10),
        updated_at: daysAgo(1),
      },
      {
        id: 'ccccccc2-cccc-4ccc-cccc-cccccccccccc',
        user_id: '11111111-1111-4111-a111-111111111111',
        scholarship_id: 'aaaaaaa2-aaaa-4aaa-aaaa-aaaaaaaaaaa2',
        stage: 'submitted',
        target_deadline: daysFromNow(5),
        notes: 'Submitted on Feb 10th. Received confirmation receipt #APX-9821.',
        award_amount_won: 0.0,
        created_at: daysAgo(15),
        updated_at: daysAgo(3),
      },
      {
        id: 'ccccccc3-cccc-4ccc-cccc-cccccccccccc',
        user_id: '11111111-1111-4111-a111-111111111111',
        scholarship_id: 'aaaaaaa6-aaaa-4aaa-aaaa-aaaaaaaaaaa6',
        stage: 'considering',
        target_deadline: daysFromNow(35),
        notes: 'High award amount ($20,000). AI research proposal required.',
        award_amount_won: 0.0,
        created_at: daysAgo(5),
        updated_at: daysAgo(5),
      },
    ];

    // 6. Application Checklists
    this.applicationChecklists = [
      // Checklists for Ada Lovelace (Preparing)
      {
        id: 'chk-1',
        saved_scholarship_id: 'ccccccc1-cccc-4ccc-cccc-cccccccccccc',
        document_id: 'bbbbbbb1-bbbb-4bbb-bbbb-bbbbbbbbbbb1',
        status: 'ready',
        file_name: 'Elena_Rostova_Official_Transcript_2026.pdf',
        document_url: 'https://example.org/files/transcript.pdf',
        notes: 'Downloaded from university registrar; verified Fall 3.82 GPA included.',
        completed_at: daysAgo(2),
        created_at: daysAgo(10),
        updated_at: daysAgo(2),
      },
      {
        id: 'chk-2',
        saved_scholarship_id: 'ccccccc1-cccc-4ccc-cccc-cccccccccccc',
        document_id: 'bbbbbbb2-bbbb-4bbb-bbbb-bbbbbbbbbbb2',
        status: 'in_progress',
        file_name: null,
        document_url: null,
        notes: 'Spoke with Prof. Williams during office hours; she requested bullet points.',
        completed_at: null,
        created_at: daysAgo(10),
        updated_at: daysAgo(3),
      },
      {
        id: 'chk-3',
        saved_scholarship_id: 'ccccccc1-cccc-4ccc-cccc-cccccccccccc',
        document_id: 'bbbbbbb3-bbbb-4bbb-bbbb-bbbbbbbbbbb3',
        status: 'in_progress',
        file_name: 'Leadership_Essay_Draft_v2.docx',
        document_url: 'https://example.org/files/essay_v2.docx',
        notes: 'Second draft done; scheduled writing center consultation for tomorrow.',
        completed_at: null,
        created_at: daysAgo(10),
        updated_at: daysAgo(1),
      },
      {
        id: 'chk-4',
        saved_scholarship_id: 'ccccccc1-cccc-4ccc-cccc-cccccccccccc',
        document_id: 'bbbbbbb4-bbbb-4bbb-bbbb-bbbbbbbbbbb4',
        status: 'missing',
        file_name: null,
        document_url: null,
        notes: 'Need to add ACM web development chair project to resume.',
        completed_at: null,
        created_at: daysAgo(10),
        updated_at: daysAgo(10),
      },

      // Checklists for NextGen First-Gen (Submitted)
      {
        id: 'chk-5',
        saved_scholarship_id: 'ccccccc2-cccc-4ccc-cccc-cccccccccccc',
        document_id: 'bbbbbbb5-bbbb-4bbb-bbbb-bbbbbbbbbbb5',
        status: 'submitted',
        file_name: 'FAFSA_SAR_2025_2026_ElenaRostova.pdf',
        document_url: 'https://example.org/files/fafsa_sar.pdf',
        notes: 'Official FAFSA SAR uploaded to Apex portal.',
        completed_at: daysAgo(3),
        created_at: daysAgo(15),
        updated_at: daysAgo(3),
      },
      {
        id: 'chk-6',
        saved_scholarship_id: 'ccccccc2-cccc-4ccc-cccc-cccccccccccc',
        document_id: 'bbbbbbb6-bbbb-4bbb-bbbb-bbbbbbbbbbb6',
        status: 'submitted',
        file_name: 'FirstGen_Resilience_Final.pdf',
        document_url: 'https://example.org/files/resilience_final.pdf',
        notes: 'Final essay proofread and submitted.',
        completed_at: daysAgo(3),
        created_at: daysAgo(15),
        updated_at: daysAgo(3),
      },
      {
        id: 'chk-7',
        saved_scholarship_id: 'ccccccc2-cccc-4ccc-cccc-cccccccccccc',
        document_id: 'bbbbbbb7-bbbb-4bbb-bbbb-bbbbbbbbbbb7',
        status: 'submitted',
        file_name: 'Counselor_Reference_Letter.pdf',
        document_url: 'https://example.org/files/counselor_ref.pdf',
        notes: 'Direct portal submission confirmed by school counselor.',
        completed_at: daysAgo(3),
        created_at: daysAgo(15),
        updated_at: daysAgo(3),
      },
    ];

    // 7. Audit Logs
    this.auditLogs = [
      {
        id: 'aud-1',
        entity_type: 'scholarship',
        entity_id: 'aaaaaaa1-aaaa-4aaa-aaaa-aaaaaaaaaaa1',
        action: 'VERIFY_RECORD',
        actor_id: '33333333-3333-4333-a333-333333333333',
        actor_name: 'Sarah Jenkins',
        actor_role: 'operator',
        details: { note: 'Verified 2026 application cycle and verified live portal URL.' },
        created_at: daysAgo(5),
      },
      {
        id: 'aud-2',
        entity_type: 'scholarship',
        entity_id: 'aaaaaaa4-aaaa-4aaa-aaaa-aaaaaaaaaaa4',
        action: 'FLAG_STALE',
        actor_id: null,
        actor_name: 'System Scheduler',
        actor_role: 'system',
        details: { days_unverified: 112, reason: 'Exceeded 90-day verification SLA threshold.' },
        created_at: daysAgo(22),
      },
      {
        id: 'aud-3',
        entity_type: 'saved_scholarship',
        entity_id: 'ccccccc2-cccc-4ccc-cccc-cccccccccccc',
        action: 'STAGE_TRANSITION',
        actor_id: '11111111-1111-4111-a111-111111111111',
        actor_name: 'Elena Rostova',
        actor_role: 'student',
        details: { from_stage: 'preparing', to_stage: 'submitted' },
        created_at: daysAgo(3),
      },
    ];
  }
}

export const inMemoryDb = new InMemoryRepository();

/**
 * Check if remote Supabase database responds to queries
 */
export async function testSupabaseConnection() {
  if (!supabase) {
    return { connected: false, message: 'Supabase credentials not configured in .env' };
  }
  try {
    const { data, error } = await supabase.from('scholarships').select('id').limit(1);
    if (error) throw error;
    isSupabaseConnected = true;
    return { connected: true, message: 'Connected to Supabase PostgreSQL cloud instance' };
  } catch (err) {
    isSupabaseConnected = false;
    return { connected: false, message: `Supabase connection error: ${err.message}` };
  }
}

export { supabase, isSupabaseConnected };
