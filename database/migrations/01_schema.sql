-- ==============================================================================
-- Scholarship Eligibility and Application Deadline Navigator
-- Migration: 01_schema.sql
-- PostgreSQL / Supabase Schema Definition
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. PROFILES / USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'student' CHECK (role IN ('visitor', 'student', 'operator', 'admin')),
    gpa NUMERIC(3, 2) DEFAULT 3.50 CHECK (gpa >= 0.00 AND gpa <= 4.00),
    major VARCHAR(128) DEFAULT 'Computer Science',
    degree_level VARCHAR(64) DEFAULT 'Undergraduate' CHECK (degree_level IN ('High School Senior', 'Undergraduate', 'Graduate', 'Doctorate', 'Vocational / Certificate')),
    residency_status VARCHAR(64) DEFAULT 'US Citizen' CHECK (residency_status IN ('US Citizen', 'Permanent Resident', 'DACA / Undocumented', 'International', 'Eligible Non-Citizen')),
    state_of_residence VARCHAR(64) DEFAULT 'California',
    household_income NUMERIC(12, 2) DEFAULT 55000.00,
    is_first_generation BOOLEAN DEFAULT true,
    is_military_connected BOOLEAN DEFAULT false,
    demographic_tags TEXT[] DEFAULT ARRAY['First-Generation College Student', 'STEM Scholar'],
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- -----------------------------------------------------------------------------
-- 2. SCHOLARSHIPS (Curated Sourced Directory)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    provider_name VARCHAR(255) NOT NULL,
    provider_url TEXT NOT NULL,
    description TEXT NOT NULL,
    award_amount NUMERIC(10, 2) NOT NULL DEFAULT 5000.00,
    currency VARCHAR(8) NOT NULL DEFAULT 'USD',
    is_renewable BOOLEAN NOT NULL DEFAULT false,
    renewable_details TEXT,
    education_levels TEXT[] NOT NULL DEFAULT ARRAY['Undergraduate'],
    eligible_majors TEXT[] NOT NULL DEFAULT ARRAY['All Majors'],
    min_gpa NUMERIC(3, 2) DEFAULT 3.00 CHECK (min_gpa >= 0.00 AND min_gpa <= 4.00),
    residency_requirements TEXT[] NOT NULL DEFAULT ARRAY['US Citizen', 'Permanent Resident'],
    need_based BOOLEAN NOT NULL DEFAULT false,
    max_household_income NUMERIC(12, 2),
    demographic_criteria TEXT[] DEFAULT ARRAY[]::TEXT[],
    deadline TIMESTAMPTZ NOT NULL,
    application_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Verification & Staleness Tracking
    verification_status VARCHAR(32) NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('verified', 'flagged_stale', 'under_review', 'archived')),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_by_name VARCHAR(255) DEFAULT 'System Curator',
    verification_notes TEXT,
    staleness_threshold_days INTEGER NOT NULL DEFAULT 90,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scholarships_deadline ON scholarships(deadline);
CREATE INDEX IF NOT EXISTS idx_scholarships_verification ON scholarships(verification_status, last_verified_at);
CREATE INDEX IF NOT EXISTS idx_scholarships_award ON scholarships(award_amount);
CREATE INDEX IF NOT EXISTS idx_scholarships_active ON scholarships(is_active);

-- -----------------------------------------------------------------------------
-- 3. SCHOLARSHIP REQUIREMENTS (Granular Rules Engine)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scholarship_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
    requirement_type VARCHAR(64) NOT NULL CHECK (requirement_type IN ('gpa', 'degree_level', 'major', 'residency', 'income', 'demographic', 'first_gen', 'military', 'custom')),
    rule_operator VARCHAR(16) NOT NULL DEFAULT 'eq' CHECK (rule_operator IN ('eq', 'gte', 'lte', 'in', 'contains', 'boolean')),
    rule_value TEXT NOT NULL,
    description TEXT NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requirements_scholarship ON scholarship_requirements(scholarship_id);

-- -----------------------------------------------------------------------------
-- 4. SCHOLARSHIP REQUIRED DOCUMENTS (Checklist Definitions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scholarship_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
    document_type VARCHAR(64) NOT NULL CHECK (document_type IN ('transcript', 'recommendation_letter', 'personal_statement', 'essay', 'fafsa_sar', 'financial_proof', 'resume_cv', 'portfolio', 'id_proof', 'other')),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    suggested_lead_time_days INTEGER DEFAULT 14,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_scholarship ON scholarship_documents(scholarship_id);

-- -----------------------------------------------------------------------------
-- 5. SAVED SCHOLARSHIPS (Student Opportunity Pipeline)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_scholarships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
    stage VARCHAR(32) NOT NULL DEFAULT 'considering' CHECK (stage IN ('considering', 'preparing', 'submitted', 'under_review', 'awarded', 'declined')),
    target_deadline TIMESTAMPTZ,
    notes TEXT,
    award_amount_won NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_scholarship UNIQUE (user_id, scholarship_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_scholarships(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_stage ON saved_scholarships(stage);

-- -----------------------------------------------------------------------------
-- 6. APPLICATION CHECKLISTS (Student Document Tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS application_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_scholarship_id UUID NOT NULL REFERENCES saved_scholarships(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES scholarship_documents(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'missing' CHECK (status IN ('missing', 'in_progress', 'ready', 'submitted')),
    file_name VARCHAR(255),
    document_url TEXT,
    notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_saved_doc UNIQUE (saved_scholarship_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_checklists_saved ON application_checklists(saved_scholarship_id);

-- -----------------------------------------------------------------------------
-- 7. VERIFICATION REVIEWS (Stale Record Review Audit)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verification_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewer_name VARCHAR(255) NOT NULL,
    action VARCHAR(64) NOT NULL CHECK (action IN ('verified_as_current', 'updated_deadline', 'updated_criteria', 'flagged_dead_link', 'archived')),
    findings TEXT NOT NULL,
    previous_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_scholarship ON verification_reviews(scholarship_id);

-- -----------------------------------------------------------------------------
-- 8. AUDIT LOGS (System-wide State Transitions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_name VARCHAR(255) NOT NULL DEFAULT 'System',
    actor_role VARCHAR(32) NOT NULL DEFAULT 'system',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- -----------------------------------------------------------------------------
-- 9. AUTOMATIC TIMESTAMP TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_timestamp ON profiles;
CREATE TRIGGER trg_profiles_timestamp BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_scholarships_timestamp ON scholarships;
CREATE TRIGGER trg_scholarships_timestamp BEFORE UPDATE ON scholarships
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_saved_timestamp ON saved_scholarships;
CREATE TRIGGER trg_saved_timestamp BEFORE UPDATE ON saved_scholarships
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS trg_checklists_timestamp ON application_checklists;
CREATE TRIGGER trg_checklists_timestamp BEFORE UPDATE ON application_checklists
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- -----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can read basic profile info; users can update their own
CREATE POLICY "Public profiles can be viewed by all authenticated users"
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Scholarships: Everyone can read active scholarships
CREATE POLICY "Scholarships are viewable by anyone"
ON scholarships FOR SELECT USING (is_active = true OR auth.role() = 'authenticated');

CREATE POLICY "Operators and admins can modify scholarships"
ON scholarships FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('operator', 'admin'))
);

-- Requirements & Documents: Viewable by anyone
CREATE POLICY "Requirements are viewable by anyone"
ON scholarship_requirements FOR SELECT USING (true);

CREATE POLICY "Documents are viewable by anyone"
ON scholarship_documents FOR SELECT USING (true);

-- Saved Scholarships: Users can only see and manage their own
CREATE POLICY "Users can manage their own saved scholarships"
ON saved_scholarships FOR ALL USING (auth.uid() = user_id);

-- Checklists: Users can manage checklist items for their own saved scholarships
CREATE POLICY "Users can manage their own checklists"
ON application_checklists FOR ALL USING (
    EXISTS (
        SELECT 1 FROM saved_scholarships
        WHERE saved_scholarships.id = application_checklists.saved_scholarship_id
        AND saved_scholarships.user_id = auth.uid()
    )
);

-- Verification Reviews: Operators & Admins can create and view
CREATE POLICY "Verification reviews viewable by authenticated users"
ON verification_reviews FOR SELECT USING (true);

CREATE POLICY "Verification reviews modifiable by staff"
ON verification_reviews FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('operator', 'admin'))
);

-- Audit logs: Read by admin/operator, inserted by system
CREATE POLICY "Audit logs viewable by staff"
ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('operator', 'admin'))
);
