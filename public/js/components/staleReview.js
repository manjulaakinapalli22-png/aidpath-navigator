import { api } from '../api.js';
import { state } from '../state.js';

export function renderStaleReview(container) {
  if (!state.isStaffOrAdmin()) {
    container.innerHTML = `
      <div class="view-header">
        <div class="view-header-title">
          <h2><span>🛡️</span> Operator Stale-Record Review Desk</h2>
          <p>Auditing scholarship sources, validating external application links, and verifying active deadlines.</p>
        </div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">🔒</div>
        <div class="empty-title">Staff / Operator Access Required</div>
        <p class="empty-desc">This operational review desk is reserved for Operators and Administrators. Please select "Sarah Jenkins (Operator / Staff)" or "Dr. Arthur Vance (Admin)" from the top persona switcher.</p>
        <button class="btn btn-warning" onclick="window.selectPersona('33333333-3333-4333-a333-333333333333')">
          Switch to Sarah Jenkins (Operator)
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <h2><span>🛡️</span> Operator Stale-Record Review Desk</h2>
        <p>Ensure directory integrity: Scholarships unverified for >90 days require staff review of official source URLs and deadlines.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-primary" id="btn-refresh-stale">
          <span>🔄</span> Refresh Review Queue
        </button>
      </div>
    </div>

    <!-- Review Policy Explainer Alert -->
    <div style="background: var(--plum-50); border: 1px solid var(--plum-200); border-radius: var(--radius-md); padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: flex-start; gap: 1rem;">
      <span style="font-size: 1.5rem;">📜</span>
      <div>
        <strong style="color: var(--plum-900); font-size: 0.95rem;">90-Day Verification SLA Policy</strong>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem; line-height: 1.5;">
          Every scholarship in AidPath is backed by a verified external foundation or university source. When a record exceeds 90 days without audit, it is automatically flagged stale. Operators must click the official portal link, verify deadline dates and award amounts, and submit a verification log.
        </p>
      </div>
    </div>

    <!-- Stale Queue Container -->
    <div class="stale-records-table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Scholarship / Provider</th>
            <th>Award</th>
            <th>Current Deadline</th>
            <th>Staleness Status</th>
            <th>Official Source Link</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody id="stale-records-tbody">
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem;">
              <div class="loading-spinner"></div>
              <p style="margin-top: 0.5rem; color: var(--text-muted);">Fetching stale review records...</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Verification Modal -->
    <div id="verify-record-modal" class="modal-backdrop">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Verify Scholarship Record</h3>
          <button class="modal-close-btn" onclick="document.getElementById('verify-record-modal').classList.remove('open')">&times;</button>
        </div>
        <form id="verify-record-form">
          <div class="modal-body">
            <input type="hidden" id="verif-sch-id" />
            
            <div style="background: var(--surface-card-subtle); padding: 0.85rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
              <h4 id="verif-sch-title" style="color: var(--plum-900); font-size: 1rem;"></h4>
              <p id="verif-sch-provider" style="font-size: 0.82rem; color: var(--text-muted);"></p>
            </div>

            <div class="form-group">
              <label>Official Sponsor Portal Link</label>
              <div style="display: flex; gap: 0.5rem;">
                <input type="url" id="verif-provider-url" class="form-control" required />
                <a id="verif-test-link" href="#" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="white-space: nowrap;">
                  Open ↗
                </a>
              </div>
              <div class="form-hint">Click "Open ↗" to inspect the live portal before verifying.</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label>Verified Award Amount ($)</label>
                <input type="number" id="verif-award" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Verified Application Deadline</label>
                <input type="date" id="verif-deadline" class="form-control" required />
              </div>
            </div>

            <div class="form-group">
              <label>Verification Audit Findings & Notes</label>
              <textarea id="verif-notes" class="form-control" rows="3" placeholder="Describe confirmation details (e.g., Checked sponsor website, confirmed spring cycle requirements and active essay prompts)." required></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('verify-record-modal').classList.remove('open')">Cancel</button>
            <button type="submit" class="btn btn-success">
              <span>✓</span> Confirm & Mark Verified Today
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('btn-refresh-stale')?.addEventListener('click', loadStaleQueue);

  // Verification form submit
  document.getElementById('verify-record-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('verif-sch-id').value;
    const providerUrl = document.getElementById('verif-provider-url').value;
    const award = document.getElementById('verif-award').value;
    const deadline = document.getElementById('verif-deadline').value;
    const notes = document.getElementById('verif-notes').value;

    try {
      await api.verifyScholarship(id, {
        provider_url: providerUrl,
        award_amount: award,
        deadline: new Date(deadline).toISOString(),
        notes: notes,
        action: 'verified_as_current',
      });

      window.showToast('Scholarship successfully verified as current!', 'success');
      document.getElementById('verify-record-modal').classList.remove('open');
      loadStaleQueue();
    } catch (err) {
      window.showToast(err.message, 'error');
    }
  });

  loadStaleQueue();
}

async function loadStaleQueue() {
  const tbody = document.getElementById('stale-records-tbody');
  if (!tbody) return;

  try {
    const res = await api.getStaleScholarships();
    const items = res.data || [];
    state.setStaleRecords(items);

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 3rem;">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🎉</div>
            <strong style="color: var(--emerald-text); font-size: 1.1rem; display: block;">All Records Are Currently Verified!</strong>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
              No scholarships currently exceed the 90-day SLA threshold.
            </p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = items
      .map(
        (item) => `
      <tr id="stale-row-${item.id}">
        <td>
          <strong style="color: var(--plum-900); font-size: 0.95rem; display: block;">${item.title}</strong>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${item.provider_name}</span>
        </td>
        <td>
          <strong style="color: var(--emerald-text);">$${parseFloat(item.award_amount).toLocaleString()}</strong>
        </td>
        <td>
          ${new Date(item.deadline).toLocaleDateString()}
        </td>
        <td>
          <span class="role-badge operator" style="display: inline-flex; align-items: center; gap: 0.3rem;">
            <span>⚠️</span> ${item.days_since_verified || 90}+ days unverified
          </span>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">
            Last: ${item.last_verified_at ? new Date(item.last_verified_at).toLocaleDateString() : 'Never'}
          </div>
        </td>
        <td>
          <a href="${item.provider_url}" target="_blank" rel="noopener noreferrer" style="font-size: 0.82rem; color: var(--blue-700); font-weight: 600;">
            Source Link ↗
          </a>
        </td>
        <td style="text-align: right;">
          <button class="btn btn-primary btn-sm" id="btn-open-verify-${item.id}">
            <span>✓</span> Verify Now
          </button>
        </td>
      </tr>
    `
      )
      .join('');

    // Attach verify button handlers
    items.forEach((item) => {
      document.getElementById(`btn-open-verify-${item.id}`)?.addEventListener('click', () => {
        openVerificationDialog(item);
      });
    });
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="color: var(--rose-text); background: var(--rose-50); padding: 1.5rem; text-align: center;">
          Error loading stale queue: ${err.message}
        </td>
      </tr>
    `;
  }
}

function openVerificationDialog(item) {
  const modal = document.getElementById('verify-record-modal');
  document.getElementById('verif-sch-id').value = item.id;
  document.getElementById('verif-sch-title').textContent = item.title;
  document.getElementById('verif-sch-provider').textContent = item.provider_name;
  document.getElementById('verif-provider-url').value = item.provider_url;
  document.getElementById('verif-test-link').href = item.provider_url;
  document.getElementById('verif-award').value = item.award_amount;
  document.getElementById('verif-deadline').value = item.deadline ? item.deadline.split('T')[0] : '';
  document.getElementById('verif-notes').value = `Verified with official sponsor catalog. Active 2026 cycle confirmed by ${state.currentUser?.full_name || 'Staff'}.`;

  modal.classList.add('open');
}
