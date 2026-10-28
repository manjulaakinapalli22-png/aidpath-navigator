import { inMemoryDb } from '../config/supabase.js';

export class ApplicationService {
  /**
   * Helper to calculate deadline urgency and days remaining
   */
  static calculateUrgency(deadlineIso) {
    if (!deadlineIso) return { days_remaining: null, urgency: 'none', label: 'No Deadline' };

    const now = new Date();
    const target = new Date(deadlineIso);
    const diffMs = target - now;
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let urgency = 'normal';
    let label = `${days} days left`;

    if (days < 0) {
      urgency = 'expired';
      label = `Passed ${Math.abs(days)}d ago`;
    } else if (days === 0) {
      urgency = 'critical';
      label = 'Due Today!';
    } else if (days <= 3) {
      urgency = 'critical';
      label = `Closing in ${days}d!`;
    } else if (days <= 14) {
      urgency = 'urgent';
      label = `Due in ${days} days`;
    } else {
      urgency = 'upcoming';
      label = `${days} days remaining`;
    }

    return { days_remaining: days, urgency, label };
  }

  /**
   * Get all saved scholarships for a user with related scholarship details and checklist progress
   */
  static async getUserApplications(userId, filters = {}) {
    const saved = inMemoryDb.savedScholarships.filter((s) => s.user_id === userId);

    const applications = saved.map((item) => {
      const scholarship = inMemoryDb.scholarships.find((sch) => sch.id === item.scholarship_id) || {};
      const checklists = inMemoryDb.applicationChecklists.filter((chk) => chk.saved_scholarship_id === item.id);

      // Checklist completion stats
      const totalDocs = checklists.length;
      const readyOrSubmitted = checklists.filter((c) => c.status === 'ready' || c.status === 'submitted').length;
      const progressPercent = totalDocs > 0 ? Math.round((readyOrSubmitted / totalDocs) * 100) : 0;

      // Deadline calculation
      const effectiveDeadline = item.target_deadline || scholarship.deadline;
      const deadlineInfo = this.calculateUrgency(effectiveDeadline);

      return {
        ...item,
        scholarship: {
          id: scholarship.id,
          title: scholarship.title,
          provider_name: scholarship.provider_name,
          provider_url: scholarship.provider_url,
          award_amount: scholarship.award_amount,
          is_renewable: scholarship.is_renewable,
          deadline: scholarship.deadline,
          application_url: scholarship.application_url,
          verification_status: scholarship.verification_status,
          last_verified_at: scholarship.last_verified_at,
        },
        checklist_summary: {
          total: totalDocs,
          completed: readyOrSubmitted,
          progress_percent: progressPercent,
        },
        deadline_info: deadlineInfo,
      };
    });

    // Optional stage filter
    if (filters.stage && filters.stage !== 'all') {
      return applications.filter((app) => app.stage === filters.stage);
    }

    // Default sort by closest deadline
    applications.sort((a, b) => {
      const dayA = a.deadline_info.days_remaining !== null ? a.deadline_info.days_remaining : 9999;
      const dayB = b.deadline_info.days_remaining !== null ? b.deadline_info.days_remaining : 9999;
      return dayA - dayB;
    });

    return applications;
  }

  /**
   * Save a scholarship into student's pipeline
   */
  static async saveOpportunity(userId, scholarshipId, notes = '', customDeadline = null) {
    // Check if scholarship exists
    const scholarship = inMemoryDb.scholarships.find((s) => s.id === scholarshipId);
    if (!scholarship) {
      throw new Error('Scholarship not found.');
    }

    // Check if already saved
    const existing = inMemoryDb.savedScholarships.find(
      (s) => s.user_id === userId && s.scholarship_id === scholarshipId
    );
    if (existing) {
      return existing;
    }

    const savedId = `sav-${Date.now()}`;
    const now = new Date().toISOString();

    const newSaved = {
      id: savedId,
      user_id: userId,
      scholarship_id: scholarshipId,
      stage: 'considering',
      target_deadline: customDeadline || scholarship.deadline,
      notes: notes || 'Discovered and saved for review.',
      award_amount_won: 0.0,
      created_at: now,
      updated_at: now,
    };

    inMemoryDb.savedScholarships.push(newSaved);

    // Auto-instantiate document checklist items for this scholarship
    const docs = inMemoryDb.scholarshipDocuments.filter((d) => d.scholarship_id === scholarshipId);
    docs.forEach((doc, idx) => {
      inMemoryDb.applicationChecklists.push({
        id: `chk-${Date.now()}-${idx}`,
        saved_scholarship_id: savedId,
        document_id: doc.id,
        status: 'missing',
        file_name: null,
        document_url: null,
        notes: '',
        completed_at: null,
        created_at: now,
        updated_at: now,
      });
    });

    // Audit log
    inMemoryDb.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      entity_type: 'saved_scholarship',
      entity_id: savedId,
      action: 'SAVE_OPPORTUNITY',
      actor_id: userId,
      actor_name: 'Student',
      actor_role: 'student',
      details: { scholarship_id: scholarshipId, title: scholarship.title },
      created_at: now,
    });

    return newSaved;
  }

  /**
   * Update application stage (considering -> preparing -> submitted -> under_review -> awarded -> declined)
   */
  static async updateStage(savedId, userId, newStage, stageDetails = {}) {
    const validStages = ['considering', 'preparing', 'submitted', 'under_review', 'awarded', 'declined'];
    if (!validStages.includes(newStage)) {
      throw new Error(`Invalid stage "${newStage}". Valid: ${validStages.join(', ')}`);
    }

    const app = inMemoryDb.savedScholarships.find((s) => s.id === savedId && s.user_id === userId);
    if (!app) {
      throw new Error('Saved application record not found or access denied.');
    }

    const previousStage = app.stage;
    const now = new Date().toISOString();

    app.stage = newStage;
    app.updated_at = now;

    if (stageDetails.notes !== undefined) {
      app.notes = stageDetails.notes;
    }
    if (newStage === 'awarded') {
      const scholarship = inMemoryDb.scholarships.find((s) => s.id === app.scholarship_id);
      app.award_amount_won = stageDetails.award_amount_won !== undefined
        ? parseFloat(stageDetails.award_amount_won)
        : (scholarship ? scholarship.award_amount : 0.0);
    }

    // Audit log
    inMemoryDb.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      entity_type: 'saved_scholarship',
      entity_id: savedId,
      action: 'STAGE_TRANSITION',
      actor_id: userId,
      actor_name: 'Student',
      actor_role: 'student',
      details: {
        from_stage: previousStage,
        to_stage: newStage,
        notes: app.notes,
        award_amount_won: app.award_amount_won,
      },
      created_at: now,
    });

    return app;
  }

  /**
   * Remove a saved scholarship (and its checklists)
   */
  static async removeSavedOpportunity(savedId, userId) {
    const index = inMemoryDb.savedScholarships.findIndex((s) => s.id === savedId && s.user_id === userId);
    if (index === -1) {
      throw new Error('Application record not found or access denied.');
    }

    inMemoryDb.savedScholarships.splice(index, 1);
    // Cascade remove checklists
    inMemoryDb.applicationChecklists = inMemoryDb.applicationChecklists.filter(
      (c) => c.saved_scholarship_id !== savedId
    );

    return { success: true, removed_id: savedId };
  }
}
