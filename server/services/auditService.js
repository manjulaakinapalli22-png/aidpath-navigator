import { inMemoryDb } from '../config/supabase.js';

export class AuditService {
  /**
   * Record an audit event
   */
  static async log(entityType, entityId, action, actor, details = {}) {
    const entry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      actor_id: actor ? actor.id : null,
      actor_name: actor ? actor.full_name : 'System',
      actor_role: actor ? actor.role : 'system',
      details: details,
      created_at: new Date().toISOString(),
    };

    inMemoryDb.auditLogs.unshift(entry);
    return entry;
  }

  /**
   * Query audit logs with pagination and filters
   */
  static async getLogs(filters = {}) {
    let logs = [...inMemoryDb.auditLogs];

    if (filters.entity_type) {
      logs = logs.filter((l) => l.entity_type === filters.entity_type);
    }
    if (filters.action) {
      logs = logs.filter((l) => l.action.toLowerCase() === filters.action.toLowerCase());
    }
    if (filters.actor_role) {
      logs = logs.filter((l) => l.actor_role === filters.actor_role);
    }

    const limit = parseInt(filters.limit || '50', 10);
    return logs.slice(0, limit);
  }
}
