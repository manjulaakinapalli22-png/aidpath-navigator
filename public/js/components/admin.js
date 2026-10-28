import { api } from '../api.js';
import { state } from '../state.js';

export function renderAdmin(container) {
  if (!state.isAdmin()) {
    container.innerHTML = `
      <div class="view-header">
        <div class="view-header-title">
          <h2><span>⚙️</span> Administration & Governance</h2>
          <p>Curate scholarship taxonomy, configure rules, and review immutable audit event history.</p>
        </div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">🔐</div>
        <div class="empty-title">Administrator Privileges Required</div>
        <p class="empty-desc">This governance dashboard is restricted to system administrators. Please select "Dr. Arthur Vance (Administrator)" from the top persona switcher.</p>
        <button class="btn btn-primary" onclick="window.selectPersona('44444444-4444-4444-a444-444444444444')">
          Switch to Dr. Arthur Vance (Admin)
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <h2><span>⚙️</span> Administration & Governance</h2>
        <p>Curate scholarship catalog, manage taxonomy, inspect operational metrics, and review immutable audit events.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary" id="btn-admin-add-new">
          <span>+</span> Curate New Scholarship
        </button>
      </div>
    </div>

    <!-- Operational Metrics Grid -->
    <div class="stats-grid" id="admin-metrics-grid">
      <div class="stat-card">
        <div class="stat-icon-wrapper plum">🏛️</div>
        <div>
          <div class="stat-value" id="admin-stat-total">--</div>
          <div class="stat-label">Total Curated Scholarships</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper emerald">💵</div>
        <div>
          <div class="stat-value" id="admin-stat-funds">--</div>
          <div class="stat-label">Total Award Funding</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper">🛡️</div>
        <div>
          <div class="stat-value" id="admin-stat-sla">--</div>
          <div class="stat-label">Verification SLA Compliance</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper amber">📜</div>
        <div>
          <div class="stat-value" id="admin-stat-audits">--</div>
          <div class="stat-label">Recorded Audit Logs</div>
        </div>
      </div>
    </div>

    <!-- Audit Logs Section -->
    <div style="background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: var(--radius-lg); padding: 1.5rem; margin-top: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--plum-900);">System Audit Trail</h3>
          <p style="font-size: 0.82rem; color: var(--text-muted);">Immutable event history of state transitions, verifications, and record creations.</p>
        </div>
        <button class="btn btn-outline btn-sm" id="btn-refresh-audit">
          <span>🔄</span> Refresh Logs
        </button>
      </div>

      <div class="stale-records-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Actor</th>
              <th>Role</th>
              <th>Event Details</th>
            </tr>
          </thead>
          <tbody id="audit-logs-tbody">
            <tr>
              <td colspan="6" style="text-align: center; padding: 2rem;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 0.5rem; color: var(--text-muted);">Fetching audit logs...</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Curate New Scholarship Modal -->
    <div id="admin-new-scholarship-modal" class="modal-backdrop">
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <h3 class="modal-title">Curate New Scholarship Opportunity</h3>
          <button class="modal-close-btn" onclick="document.getElementById('admin-new-scholarship-modal').classList.remove('open')">&times;</button>
        </div>
        <form id="admin-create-sch-form">
          <div class="modal-body">
            <div class="form-group">
              <label>Scholarship Title</label>
              <input type="text" id="cs-title" class="form-control" placeholder="e.g. Grace Hopper Future Tech Leadership Fellowship" required />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label>Sponsor / Provider Name</label>
                <input type="text" id="cs-provider" class="form-control" placeholder="e.g. Turing Foundation" required />
              </div>
              <div class="form-group">
                <label>Official Provider Source URL</label>
                <input type="url" id="cs-provider-url" class="form-control" placeholder="https://foundation.org/grant" required />
              </div>
            </div>

            <div class="form-group">
              <label>Description & Scope</label>
              <textarea id="cs-desc" class="form-control" rows="3" placeholder="Describe the purpose, mentorship opportunities, and selection philosophy..." required></textarea>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <div class="form-group">
                <label>Award Amount ($)</label>
                <input type="number" id="cs-amount" class="form-control" value="7500" required />
              </div>
              <div class="form-group">
                <label>Application Deadline</label>
                <input type="date" id="cs-deadline" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Minimum GPA</label>
                <input type="number" step="0.05" id="cs-min-gpa" class="form-control" placeholder="e.g. 3.20" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label>Target Degree Levels (comma-separated)</label>
                <input type="text" id="cs-levels" class="form-control" value="Undergraduate" required />
              </div>
              <div class="form-group">
                <label>Eligible Majors (comma-separated)</label>
                <input type="text" id="cs-majors" class="form-control" value="Computer Science, Software Engineering" required />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label>Is Need-Based?</label>
                <select id="cs-need-based" class="form-control">
                  <option value="false">No (Merit-Based)</option>
                  <option value="true">Yes (Need-Based)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Is Renewable?</label>
                <select id="cs-renewable" class="form-control">
                  <option value="false">No (One-Time)</option>
                  <option value="true">Yes (Multi-Year Renewable)</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('admin-new-scholarship-modal').classList.remove('open')">Cancel</button>
            <button type="submit" class="btn btn-primary">
              <span>+</span> Publish to Curated Directory
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Attach modal open
  document.getElementById('btn-admin-add-new')?.addEventListener('click', () => {
    // default deadline to 45 days from now
    const d = new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0];
    const dlInput = document.getElementById('cs-deadline');
    if (dlInput) dlInput.value = d;
    document.getElementById('admin-new-scholarship-modal').classList.add('open');
  });

  // Attach form submit
  document.getElementById('admin-create-sch-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const title = document.getElementById('cs-title').value;
      const provider = document.getElementById('cs-provider').value;
      const providerUrl = document.getElementById('cs-provider-url').value;
      const desc = document.getElementById('cs-desc').value;
      const amount = document.getElementById('cs-amount').value;
      const deadline = document.getElementById('cs-deadline').value;
      const minGpa = document.getElementById('cs-min-gpa').value;
      const levels = document.getElementById('cs-levels').value.split(',').map((s) => s.trim());
      const majors = document.getElementById('cs-majors').value.split(',').map((s) => s.trim());
      const needBased = document.getElementById('cs-need-based').value === 'true';
      const renewable = document.getElementById('cs-renewable').value === 'true';

      await api.createScholarship({
        title,
        provider_name: provider,
        provider_url: providerUrl,
        description: desc,
        award_amount: amount,
        deadline: new Date(deadline).toISOString(),
        min_gpa: minGpa ? parseFloat(minGpa) : null,
        education_levels: levels,
        eligible_majors: majors,
        need_based: needBased,
        is_renewable: renewable,
        documents: [
          { name: 'Official Transcript', document_type: 'transcript', is_mandatory: true },
          { name: 'Recommendation Letter', document_type: 'recommendation_letter', is_mandatory: true },
          { name: 'Personal Statement', document_type: 'personal_statement', is_mandatory: true },
        ],
      });

      window.showToast(`Scholarship "${title}" published to directory!`, 'success');
      document.getElementById('admin-new-scholarship-modal').classList.remove('open');
      document.getElementById('admin-create-sch-form').reset();
      loadAdminStats();
      loadAuditLogs();
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });

  document.getElementById('btn-refresh-audit')?.addEventListener('click', loadAuditLogs);

  loadAdminStats();
  loadAuditLogs();
}

async function loadAdminStats() {
  try {
    const res = await api.getOperationalMetrics();
    const stats = res.data;
    if (stats) {
      document.getElementById('admin-stat-total').textContent = stats.total_scholarships;
      document.getElementById('admin-stat-funds').textContent = `$${stats.total_funding_available.toLocaleString()}`;
      document.getElementById('admin-stat-sla').textContent = `${stats.sla_compliance_rate}%`;
      document.getElementById('admin-stat-audits').textContent = stats.audit_events_count;
    }
  } catch (err) {
    console.error('Failed to load admin stats:', err);
  }
}

async function loadAuditLogs() {
  const tbody = document.getElementById('audit-logs-tbody');
  if (!tbody) return;

  try {
    const res = await api.getAuditLogs({ limit: 25 });
    const logs = res.data || [];

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No audit logs recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs
      .map(
        (l) => `
      <tr>
        <td style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--text-muted);">
          ${new Date(l.created_at).toLocaleString()}
        </td>
        <td>
          <span class="role-badge ${l.action.includes('VERIFY') ? 'student' : l.action.includes('CREATE') ? 'admin' : 'operator'}" style="font-size: 0.7rem;">
            ${l.action}
          </span>
        </td>
        <td style="font-size: 0.85rem; font-weight: 600;">
          ${l.entity_type}
        </td>
        <td style="font-size: 0.85rem;">
          ${l.actor_name || 'System'}
        </td>
        <td>
          <span class="role-badge ${l.actor_role}">${l.actor_role}</span>
        </td>
        <td style="font-size: 0.78rem; color: var(--text-secondary); max-width: 320px; word-break: break-all;">
          ${JSON.stringify(l.details || {})}
        </td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color: var(--rose-text); text-align: center;">Error: ${err.message}</td></tr>`;
  }
}
