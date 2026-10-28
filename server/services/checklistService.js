import { inMemoryDb } from '../config/supabase.js';

export class ChecklistService {
  /**
   * Get all checklist items for a saved application
   */
  static async getChecklistForApplication(savedScholarshipId, userId) {
    const saved = inMemoryDb.savedScholarships.find((s) => s.id === savedScholarshipId);
    if (!saved) throw new Error('Saved application not found');

    if (userId && saved.user_id !== userId) {
      throw new Error('Unauthorized to view this checklist');
    }

    const items = inMemoryDb.applicationChecklists.filter(
      (c) => c.saved_scholarship_id === savedScholarshipId
    );

    const populated = items.map((item) => {
      const docDef = inMemoryDb.scholarshipDocuments.find((d) => d.id === item.document_id) || {};
      return {
        ...item,
        document_def: {
          id: docDef.id,
          name: docDef.name || 'Required Document',
          document_type: docDef.document_type || 'other',
          description: docDef.description || '',
          is_mandatory: docDef.is_mandatory !== false,
          suggested_lead_time_days: docDef.suggested_lead_time_days || 7,
        },
      };
    });

    const total = populated.length;
    const ready = populated.filter((i) => i.status === 'ready').length;
    const submitted = populated.filter((i) => i.status === 'submitted').length;
    const inProgress = populated.filter((i) => i.status === 'in_progress').length;
    const missing = populated.filter((i) => i.status === 'missing').length;

    const completed = ready + submitted;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      saved_scholarship_id: savedScholarshipId,
      items: populated,
      summary: {
        total,
        completed,
        percentage,
        breakdown: { ready, submitted, inProgress, missing },
      },
    };
  }

  /**
   * Update a checklist item's status, notes, or uploaded file
   */
  static async updateChecklistItem(checklistItemId, updates = {}) {
    const item = inMemoryDb.applicationChecklists.find((c) => c.id === checklistItemId);
    if (!item) throw new Error('Checklist item not found');

    const validStatuses = ['missing', 'in_progress', 'ready', 'submitted'];
    if (updates.status && !validStatuses.includes(updates.status)) {
      throw new Error(`Invalid status: ${updates.status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const now = new Date().toISOString();

    if (updates.status !== undefined) item.status = updates.status;
    if (updates.notes !== undefined) item.notes = updates.notes;
    if (updates.file_name !== undefined) item.file_name = updates.file_name;
    if (updates.document_url !== undefined) item.document_url = updates.document_url;

    if (item.status === 'ready' || item.status === 'submitted') {
      item.completed_at = now;
    } else {
      item.completed_at = null;
    }

    item.updated_at = now;

    return item;
  }
}
