/**
 * Centralized API Client Wrapper
 * Handles headers, persona identity, JSON parsing, and error normalization.
 */

export const api = {
  activeUserId: '11111111-1111-4111-a111-111111111111', // default Elena Rostova

  setActiveUser(userId) {
    this.activeUserId = userId;
    localStorage.setItem('aidpath_user_id', userId);
  },

  getActiveUser() {
    const saved = localStorage.getItem('aidpath_user_id');
    if (saved) this.activeUserId = saved;
    return this.activeUserId;
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : endpoint;
    const headers = {
      'Content-Type': 'application/json',
      'X-User-Id': this.activeUserId,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data?.error?.message || `Request failed with HTTP ${response.status}`;
        const error = new Error(errorMsg);
        error.code = data?.error?.code || 'API_ERROR';
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err.message);
      throw err;
    }
  },

  // Auth & Personas
  getPersonas() {
    return this.request('/api/auth/personas');
  },
  getCurrentUser() {
    return this.request('/api/auth/me');
  },
  updateProfile(profileData) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
  register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Scholarships
  getScholarships(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') query.append(key, val);
    });
    return this.request(`/api/scholarships?${query.toString()}`);
  },
  getScholarshipById(id) {
    return this.request(`/api/scholarships/${id}`);
  },
  getStaleScholarships() {
    return this.request('/api/scholarships/stale/list');
  },
  verifyScholarship(id, data) {
    return this.request(`/api/scholarships/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  createScholarship(data) {
    return this.request('/api/scholarships', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateScholarship(id, data) {
    return this.request(`/api/scholarships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Eligibility Engine
  evaluateAll(profile) {
    return this.request('/api/eligibility/evaluate-all', {
      method: 'POST',
      body: JSON.stringify({ profile }),
    });
  },
  checkSingle(scholarshipId, profile) {
    return this.request('/api/eligibility/check-single', {
      method: 'POST',
      body: JSON.stringify({ scholarship_id: scholarshipId, profile }),
    });
  },
  quickCheck(criteria) {
    return this.request('/api/eligibility/quick-check', {
      method: 'POST',
      body: JSON.stringify(criteria),
    });
  },

  // Applications Pipeline
  getApplications(stage) {
    const q = stage && stage !== 'all' ? `?stage=${stage}` : '';
    return this.request(`/api/applications${q}`);
  },
  saveApplication(scholarshipId, notes, customDeadline) {
    return this.request('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        scholarship_id: scholarshipId,
        notes,
        custom_deadline: customDeadline,
      }),
    });
  },
  updateStage(applicationId, stage, stageDetails = {}) {
    return this.request(`/api/applications/${applicationId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, ...stageDetails }),
    });
  },
  deleteApplication(applicationId) {
    return this.request(`/api/applications/${applicationId}`, {
      method: 'DELETE',
    });
  },

  // Document Checklist
  getChecklist(savedScholarshipId) {
    return this.request(`/api/checklists/${savedScholarshipId}`);
  },
  updateChecklistItem(itemId, updates) {
    return this.request(`/api/checklists/item/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Operational Metrics & Audits
  getStudentMetrics() {
    return this.request('/api/metrics/student');
  },
  getOperationalMetrics() {
    return this.request('/api/metrics/operational');
  },
  getAuditLogs(filters = {}) {
    const q = new URLSearchParams(filters).toString();
    return this.request(`/api/audit-logs?${q}`);
  },
  getHealth() {
    return this.request('/api/health');
  },
};
