import { inMemoryDb, supabase, isSupabaseConnected } from '../config/supabase.js';
import { config } from '../config/env.js';

export class ScholarshipService {
  /**
   * Check staleness of scholarships against SLA threshold
   */
  static applyStalenessCheck(scholarship) {
    const thresholdDays = scholarship.staleness_threshold_days || config.stalenessThresholdDays;
    const lastVerified = new Date(scholarship.last_verified_at || scholarship.created_at);
    const now = new Date();
    const diffDays = Math.floor((now - lastVerified) / (1000 * 60 * 60 * 24));

    const isStale = diffDays >= thresholdDays;
    return {
      ...scholarship,
      days_since_verified: diffDays,
      is_stale: isStale,
      verification_status: isStale && scholarship.verification_status !== 'archived' ? 'flagged_stale' : scholarship.verification_status,
    };
  }

  /**
   * Get all active scholarships with optional search/filters/sort
   */
  static async getAll(filters = {}) {
    let items = [];

    if (isSupabaseConnected && supabase) {
      try {
        let query = supabase.from('scholarships').select('*');
        if (filters.is_active !== undefined) {
          query = query.eq('is_active', filters.is_active);
        }
        const { data, error } = await query;
        if (!error && data) items = data;
        else items = inMemoryDb.scholarships;
      } catch (e) {
        items = inMemoryDb.scholarships;
      }
    } else {
      items = inMemoryDb.scholarships;
    }

    // Apply staleness checks dynamically
    let processed = items.map(this.applyStalenessCheck);

    // Filter by active status
    if (filters.is_active !== undefined) {
      processed = processed.filter((s) => s.is_active === filters.is_active);
    } else {
      processed = processed.filter((s) => s.is_active !== false);
    }

    // Keyword search (title, provider, description)
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      processed = processed.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.provider_name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          (s.eligible_majors && s.eligible_majors.some((m) => m.toLowerCase().includes(q)))
      );
    }

    // Filter by education level
    if (filters.education_level && filters.education_level !== 'all') {
      const level = filters.education_level.toLowerCase();
      processed = processed.filter(
        (s) =>
          s.education_levels.includes('All') ||
          s.education_levels.some((l) => l.toLowerCase() === level)
      );
    }

    // Filter by major / field
    if (filters.major && filters.major !== 'all') {
      const mTarget = filters.major.toLowerCase();
      processed = processed.filter(
        (s) =>
          s.eligible_majors.some((m) => m.toLowerCase().includes('all major')) ||
          s.eligible_majors.some((m) => m.toLowerCase().includes(mTarget) || mTarget.includes(m.toLowerCase()))
      );
    }

    // Filter by verification status (stale vs verified)
    if (filters.verification_status && filters.verification_status !== 'all') {
      if (filters.verification_status === 'stale') {
        processed = processed.filter((s) => s.is_stale || s.verification_status === 'flagged_stale');
      } else if (filters.verification_status === 'verified') {
        processed = processed.filter((s) => !s.is_stale && s.verification_status === 'verified');
      }
    }

    // Filter by need-based
    if (filters.need_based !== undefined && filters.need_based !== '') {
      const nb = filters.need_based === 'true' || filters.need_based === true;
      processed = processed.filter((s) => s.need_based === nb);
    }

    // Filter by renewable
    if (filters.renewable !== undefined && filters.renewable !== '') {
      const ren = filters.renewable === 'true' || filters.renewable === true;
      processed = processed.filter((s) => s.is_renewable === ren);
    }

    // Filter by max GPA requirement
    if (filters.max_gpa_req) {
      const maxGpa = parseFloat(filters.max_gpa_req);
      processed = processed.filter((s) => !s.min_gpa || s.min_gpa <= maxGpa);
    }

    // Sorting
    const sortBy = filters.sort_by || 'deadline';
    const sortOrder = filters.sort_order || 'asc';

    processed.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'deadline') {
        valA = new Date(a.deadline).getTime();
        valB = new Date(b.deadline).getTime();
      } else if (sortBy === 'award_amount') {
        valA = parseFloat(a.award_amount) || 0;
        valB = parseFloat(b.award_amount) || 0;
      } else if (sortBy === 'last_verified') {
        valA = new Date(a.last_verified_at).getTime();
        valB = new Date(b.last_verified_at).getTime();
      } else if (sortBy === 'title') {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else {
        valA = a.created_at;
        valB = b.created_at;
      }

      if (valA < valB) return sortOrder === 'desc' ? 1 : -1;
      if (valA > valB) return sortOrder === 'desc' ? -1 : 1;
      return 0;
    });

    return processed;
  }

  /**
   * Get single scholarship by ID including its requirements and documents
   */
  static async getById(id) {
    if (isSupabaseConnected && supabase) {
      try {
        const { data: sch, error } = await supabase.from('scholarships').select('*').eq('id', id).single();
        if (sch && !error) {
          const { data: reqs } = await supabase.from('scholarship_requirements').select('*').eq('scholarship_id', id);
          const { data: docs } = await supabase.from('scholarship_documents').select('*').eq('scholarship_id', id);
          return {
            ...this.applyStalenessCheck(sch),
            requirements: reqs || [],
            documents: docs || [],
          };
        }
      } catch (e) {
        // Fallback to inMemoryDb
      }
    }

    let scholarship = inMemoryDb.scholarships.find((s) => s.id === id);
    if (!scholarship) return null;

    scholarship = this.applyStalenessCheck(scholarship);

    const requirements = inMemoryDb.scholarshipRequirements.filter((r) => r.scholarship_id === id);
    const documents = inMemoryDb.scholarshipDocuments.filter((d) => d.scholarship_id === id);

    return {
      ...scholarship,
      requirements,
      documents,
    };
  }

  /**
   * Get all scholarships flagged as stale or overdue for verification
   */
  static async getStaleRecords() {
    const all = await this.getAll();
    return all.filter((s) => s.is_stale || s.verification_status === 'flagged_stale');
  }

  /**
   * Operator / Admin: Verify a scholarship record
   */
  static async verifyRecord(id, reviewerProfile, verificationData = {}) {
    const now = new Date().toISOString();
    let previous = null;

    if (isSupabaseConnected && supabase) {
      try {
        const { data: prevSch } = await supabase.from('scholarships').select('*').eq('id', id).single();
        previous = prevSch;

        const updatePayload = {
          verification_status: 'verified',
          last_verified_at: now,
          verified_by_id: reviewerProfile.id,
          verified_by_name: reviewerProfile.full_name,
          verification_notes: verificationData.notes || 'Verified scholarship criteria and active source link.',
          updated_at: now,
        };

        if (verificationData.deadline) {
          updatePayload.deadline = new Date(verificationData.deadline).toISOString();
        }
        if (verificationData.award_amount) {
          updatePayload.award_amount = parseFloat(verificationData.award_amount);
        }
        if (verificationData.provider_url) {
          updatePayload.provider_url = verificationData.provider_url;
        }

        const { data: updatedSupabase, error: upError } = await supabase
          .from('scholarships')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        if (upError) console.warn('Supabase update warning:', upError.message);

        // Record verification review in Supabase
        await supabase.from('verification_reviews').insert({
          scholarship_id: id,
          reviewer_id: reviewerProfile.id,
          reviewer_name: reviewerProfile.full_name,
          action: verificationData.action || 'verified_as_current',
          findings: verificationData.notes || 'Checked official source portal and confirmed all parameters.',
          previous_verified_at: previous ? previous.last_verified_at : null,
          created_at: now,
        });

        // Record audit log in Supabase
        await supabase.from('audit_logs').insert({
          entity_type: 'scholarship',
          entity_id: id,
          action: 'VERIFY_RECORD',
          actor_id: reviewerProfile.id,
          actor_name: reviewerProfile.full_name,
          actor_role: reviewerProfile.role,
          details: {
            previous_verified_at: previous ? previous.last_verified_at : null,
            notes: updatePayload.verification_notes,
            action: verificationData.action || 'verified_as_current',
          },
          created_at: now,
        });

        if (updatedSupabase) {
          return this.applyStalenessCheck(updatedSupabase);
        }
      } catch (e) {
        console.warn('Supabase verification exception, applying fallback:', e.message);
      }
    }

    const index = inMemoryDb.scholarships.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Scholarship with id ${id} not found.`);
    }

    previous = inMemoryDb.scholarships[index];

    const updated = {
      ...previous,
      verification_status: 'verified',
      last_verified_at: now,
      verified_by_id: reviewerProfile.id,
      verified_by_name: reviewerProfile.full_name,
      verification_notes: verificationData.notes || 'Verified scholarship criteria and active source link.',
      updated_at: now,
    };

    if (verificationData.deadline) {
      updated.deadline = new Date(verificationData.deadline).toISOString();
    }
    if (verificationData.award_amount) {
      updated.award_amount = parseFloat(verificationData.award_amount);
    }
    if (verificationData.provider_url) {
      updated.provider_url = verificationData.provider_url;
    }

    inMemoryDb.scholarships[index] = updated;

    // Record in verification_reviews
    const reviewRecord = {
      id: `rev-${Date.now()}`,
      scholarship_id: id,
      reviewer_id: reviewerProfile.id,
      reviewer_name: reviewerProfile.full_name,
      action: verificationData.action || 'verified_as_current',
      findings: verificationData.notes || 'Checked official source portal and confirmed all parameters.',
      previous_verified_at: previous.last_verified_at,
      created_at: now,
    };
    inMemoryDb.verificationReviews.push(reviewRecord);

    // Record in audit_logs
    const auditRecord = {
      id: `aud-${Date.now()}`,
      entity_type: 'scholarship',
      entity_id: id,
      action: 'VERIFY_RECORD',
      actor_id: reviewerProfile.id,
      actor_name: reviewerProfile.full_name,
      actor_role: reviewerProfile.role,
      details: {
        previous_verified_at: previous.last_verified_at,
        notes: updated.verification_notes,
        action: reviewRecord.action,
      },
      created_at: now,
    };
    inMemoryDb.auditLogs.unshift(auditRecord);

    return this.applyStalenessCheck(updated);
  }

  /**
   * Admin: Create a new scholarship
   */
  static async createScholarship(data, creatorProfile) {
    const id = `sch-${Date.now()}`;
    const now = new Date().toISOString();

    const newScholarship = {
      id,
      title: data.title,
      provider_name: data.provider_name,
      provider_url: data.provider_url,
      description: data.description,
      award_amount: parseFloat(data.award_amount) || 1000.0,
      currency: data.currency || 'USD',
      is_renewable: Boolean(data.is_renewable),
      renewable_details: data.renewable_details || '',
      education_levels: Array.isArray(data.education_levels) ? data.education_levels : ['Undergraduate'],
      eligible_majors: Array.isArray(data.eligible_majors) ? data.eligible_majors : ['All Majors'],
      min_gpa: data.min_gpa !== undefined && data.min_gpa !== '' ? parseFloat(data.min_gpa) : null,
      residency_requirements: Array.isArray(data.residency_requirements) ? data.residency_requirements : ['US Citizen'],
      need_based: Boolean(data.need_based),
      max_household_income: data.max_household_income ? parseFloat(data.max_household_income) : null,
      demographic_criteria: Array.isArray(data.demographic_criteria) ? data.demographic_criteria : [],
      deadline: new Date(data.deadline).toISOString(),
      application_url: data.application_url || data.provider_url,
      is_active: true,
      verification_status: 'verified',
      last_verified_at: now,
      verified_by_id: creatorProfile?.id,
      verified_by_name: creatorProfile?.full_name || 'System Curator',
      verification_notes: 'Initial creation and source verification.',
      staleness_threshold_days: 90,
      created_at: now,
      updated_at: now,
    };

    inMemoryDb.scholarships.unshift(newScholarship);

    // Create default documents if specified
    if (data.documents && Array.isArray(data.documents)) {
      data.documents.forEach((doc, idx) => {
        inMemoryDb.scholarshipDocuments.push({
          id: `doc-${Date.now()}-${idx}`,
          scholarship_id: id,
          document_type: doc.document_type || 'other',
          name: doc.name || 'Required Document',
          description: doc.description || '',
          is_mandatory: doc.is_mandatory !== false,
          suggested_lead_time_days: doc.suggested_lead_time_days || 7,
        });
      });
    }

    // Audit log
    inMemoryDb.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      entity_type: 'scholarship',
      entity_id: id,
      action: 'CREATE_SCHOLARSHIP',
      actor_id: creatorProfile?.id,
      actor_name: creatorProfile?.full_name || 'Admin',
      actor_role: creatorProfile?.role || 'admin',
      details: { title: newScholarship.title, award: newScholarship.award_amount },
      created_at: now,
    });

    return this.applyStalenessCheck(newScholarship);
  }

  /**
   * Admin: Update scholarship details
   */
  static async updateScholarship(id, updates, updaterProfile) {
    const index = inMemoryDb.scholarships.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Scholarship not found');

    const prev = inMemoryDb.scholarships[index];
    const now = new Date().toISOString();

    const merged = {
      ...prev,
      ...updates,
      updated_at: now,
    };

    inMemoryDb.scholarships[index] = merged;

    inMemoryDb.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      entity_type: 'scholarship',
      entity_id: id,
      action: 'UPDATE_SCHOLARSHIP',
      actor_id: updaterProfile?.id,
      actor_name: updaterProfile?.full_name || 'Admin',
      actor_role: updaterProfile?.role || 'admin',
      details: { updated_fields: Object.keys(updates) },
      created_at: now,
    });

    return this.applyStalenessCheck(merged);
  }
}
