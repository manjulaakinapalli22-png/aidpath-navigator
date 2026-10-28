import { api } from '../api.js';
import { state } from '../state.js';
import { openChecklistModal } from './checklist.js';

export function renderApplications(container) {
  if (!state.currentUser || state.currentUser.role === 'visitor') {
    container.innerHTML = `
      <div class="view-header">
        <div class="view-header-title">
          <h2><span>🎯</span> Application Pipeline & Deadline Tracker</h2>
          <p>Organize saved scholarships, monitor urgency countdowns, and advance documents through stages.</p>
        </div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">👤</div>
        <div class="empty-title">Student Profile Required</div>
        <p class="empty-desc">You are currently viewing as a Guest Visitor. Please select a student persona (e.g., Elena Rostova) from the top bar to track saved opportunities and document checklists.</p>
        <button class="btn btn-primary" onclick="window.selectPersona('11111111-1111-4111-a111-111111111111')">
          Switch to Student Persona (Elena)
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <h2><span>🎯</span> Application Pipeline & Deadline Tracker</h2>
        <p>Monitor your opportunities across application stages, track preparation progress, and stay ahead of critical deadlines.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-secondary" onclick="document.querySelector('[data-tab=directory]').click()">
          <span>+</span> Add More from Directory
        </button>
      </div>
    </div>

    <!-- Student Dashboard Metrics Row -->
    <div class="stats-grid" id="student-pipeline-metrics">
      <div class="stat-card">
        <div class="stat-icon-wrapper plum">💰</div>
        <div>
          <div class="stat-value" id="metric-pipeline-val">$0</div>
          <div class="stat-label">Total Potential Pipeline Aid</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper emerald">🏆</div>
        <div>
          <div class="stat-value" id="metric-awarded-val">$0</div>
          <div class="stat-label">Total Aid Secured / Won</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper amber">⏱️</div>
        <div>
          <div class="stat-value" id="metric-urgent-val">0</div>
          <div class="stat-label">Urgent Deadlines (&le; 14 Days)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper">📄</div>
        <div>
          <div class="stat-value" id="metric-checklist-val">0%</div>
          <div class="stat-label">Checklist Readiness Health</div>
        </div>
      </div>
    </div>

    <!-- Pipeline Stages Filter Bar -->
    <div class="pipeline-stage-filters" id="pipeline-filter-buttons">
      <button class="stage-filter-btn active" data-stage="all">
        All Stages <span class="stage-filter-count" id="count-all">0</span>
      </button>
      <button class="stage-filter-btn" data-stage="considering">
        Considering <span class="stage-filter-count" id="count-considering">0</span>
      </button>
      <button class="stage-filter-btn" data-stage="preparing">
        Preparing Documents <span class="stage-filter-count" id="count-preparing">0</span>
      </button>
      <button class="stage-filter-btn" data-stage="submitted">
        Submitted <span class="stage-filter-count" id="count-submitted">0</span>
      </button>
      <button class="stage-filter-btn" data-stage="under_review">
        Under Review <span class="stage-filter-count" id="count-under_review">0</span>
      </button>
      <button class="stage-filter-btn" data-stage="awarded">
        Awarded <span class="stage-filter-count" id="count-awarded">0</span>
      </button>
    </div>

    <!-- Applications Grid -->
    <div id="applications-grid-container" class="application-pipeline-grid">
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 0.5rem; color: var(--text-muted);">Loading your application pipeline...</p>
      </div>
    </div>
  `;

  // Filter button click listeners
  document.querySelectorAll('#pipeline-filter-buttons button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#pipeline-filter-buttons button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      fetchAndRenderApplications(btn.dataset.stage);
    });
  });

  // Fetch applications and metrics
  fetchAndRenderApplications('all');
  loadStudentDashboardStats();
}

async function loadStudentDashboardStats() {
  try {
    const res = await api.getStudentMetrics();
    const stats = res.data;
    if (stats) {
      const pVal = document.getElementById('metric-pipeline-val');
      const aVal = document.getElementById('metric-awarded-val');
      const uVal = document.getElementById('metric-urgent-val');
      const cVal = document.getElementById('metric-checklist-val');

      if (pVal) pVal.textContent = `$${stats.pipeline_value.toLocaleString()}`;
      if (aVal) aVal.textContent = `$${stats.awarded_value.toLocaleString()}`;
      if (uVal) uVal.textContent = stats.urgent_deadlines_count;
      if (cVal) cVal.textContent = `${stats.checklist_health_percent}%`;

      // Update stage badge counts
      const br = stats.stages_breakdown || {};
      const countAll = document.getElementById('count-all');
      if (countAll) countAll.textContent = stats.total_saved;
      Object.keys(br).forEach((stage) => {
        const el = document.getElementById(`count-${stage}`);
        if (el) el.textContent = br[stage];
      });
    }
  } catch (err) {
    console.error('Failed to load student stats:', err);
  }
}

async function fetchAndRenderApplications(stageFilter = 'all') {
  const container = document.getElementById('applications-grid-container');
  if (!container) return;

  try {
    const res = await api.getApplications(stageFilter);
    const applications = res.data || [];
    state.setApplications(applications);

    if (applications.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">📁</div>
          <div class="empty-title">No applications in this stage</div>
          <p class="empty-desc">Explore the Curated Directory to discover scholarships matching your major and save them to your pipeline.</p>
          <button class="btn btn-primary" onclick="document.querySelector('[data-tab=directory]').click()">
            Explore Scholarship Directory
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = applications.map((app) => renderApplicationCard(app)).join('');

    // Attach listeners
    applications.forEach((app) => {
      // Stage transition dropdown
      const select = document.getElementById(`stage-select-${app.id}`);
      select?.addEventListener('change', async (e) => {
        const newStage = e.target.value;
        let awardAmountWon = 0;
        if (newStage === 'awarded') {
          const promptVal = prompt('Congratulations! Enter the awarded scholarship amount ($):', app.scholarship.award_amount);
          awardAmountWon = promptVal ? parseFloat(promptVal) : app.scholarship.award_amount;
        }
        try {
          await api.updateStage(app.id, newStage, { award_amount_won: awardAmountWon });
          window.showToast(`Stage updated to ${newStage.toUpperCase()}!`, 'success');
          fetchAndRenderApplications(stageFilter);
          loadStudentDashboardStats();
        } catch (err) {
          window.showToast(err.message, 'error');
          e.target.value = app.stage;
        }
      });

      // Open checklist
      document.getElementById(`btn-checklist-${app.id}`)?.addEventListener('click', () => {
        openChecklistModal(app.id, app.scholarship.title);
      });

      // Remove from pipeline
      document.getElementById(`btn-remove-app-${app.id}`)?.addEventListener('click', async () => {
        if (confirm(`Remove "${app.scholarship.title}" from your applications?`)) {
          try {
            await api.deleteApplication(app.id);
            window.showToast('Application removed.', 'info');
            fetchAndRenderApplications(stageFilter);
            loadStudentDashboardStats();
          } catch (err) {
            window.showToast(err.message, 'error');
          }
        }
      });
    });
  } catch (err) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; color: var(--rose-text); background: var(--rose-50); padding: 1.5rem; border-radius: var(--radius-lg);">
        Error loading applications: ${err.message}
      </div>
    `;
  }
}

function renderApplicationCard(app) {
  const s = app.scholarship;
  const d = app.deadline_info;
  const chk = app.checklist_summary;

  let deadlinePillClass = 'upcoming';
  if (d.urgency === 'critical') deadlinePillClass = 'critical';
  if (d.urgency === 'urgent') deadlinePillClass = 'urgent';

  const isAwarded = app.stage === 'awarded';

  return `
    <div class="application-card" id="app-card-${app.id}">
      <div class="card-header-row">
        <span style="font-size: 0.78rem; font-weight: 700; color: var(--plum-700); text-transform: uppercase;">
          ${s.provider_name}
        </span>
        <div class="award-badge ${isAwarded ? 'award-won' : ''}">
          $${parseFloat(isAwarded ? app.award_amount_won || s.award_amount : s.award_amount).toLocaleString()}
          ${isAwarded ? '<span style="font-size: 0.65rem; color: var(--emerald-text); display: block;">Award Won!</span>' : ''}
        </div>
      </div>

      <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--plum-950); margin-bottom: 0.4rem;">
        ${s.title}
      </h3>

      <!-- Urgency Banner -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.65rem 0; font-size: 0.8rem;">
        <span class="deadline-pill ${deadlinePillClass}">
          ⏰ ${d.label}
        </span>
        <span style="color: var(--text-muted); font-size: 0.75rem;">
          Final Due: ${new Date(s.deadline).toLocaleDateString()}
        </span>
      </div>

      <!-- Application Stage Dropdown Selector -->
      <div class="stage-selector-wrapper">
        <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 0.25rem;">
          CURRENT APPLICATION STAGE
        </label>
        <select class="stage-select" id="stage-select-${app.id}">
          <option value="considering" ${app.stage === 'considering' ? 'selected' : ''}>📌 1. Considering / Saved</option>
          <option value="preparing" ${app.stage === 'preparing' ? 'selected' : ''}>📝 2. Preparing Documents</option>
          <option value="submitted" ${app.stage === 'submitted' ? 'selected' : ''}>🚀 3. Submitted to Provider</option>
          <option value="under_review" ${app.stage === 'under_review' ? 'selected' : ''}>⏳ 4. Under Review</option>
          <option value="awarded" ${app.stage === 'awarded' ? 'selected' : ''}>🎉 5. Awarded / Won</option>
          <option value="declined" ${app.stage === 'declined' ? 'selected' : ''}>❌ 6. Declined</option>
        </select>
      </div>

      <!-- Document Preparation Progress Rail -->
      <div class="progress-rail">
        <div class="progress-rail-labels">
          <span>Required Documents: <strong>${chk.completed} / ${chk.total}</strong></span>
          <span>${chk.progress_percent}% Ready</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar ${chk.progress_percent === 100 ? 'complete' : ''}" style="width: ${chk.progress_percent}%;"></div>
        </div>
      </div>

      <!-- Notes preview -->
      <p style="font-size: 0.82rem; color: var(--text-secondary); background: var(--surface-card-subtle); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); margin: 0.75rem 0; font-style: italic;">
        "${app.notes || 'No notes added yet.'}"
      </p>

      <!-- Action Buttons -->
      <div class="card-footer-actions">
        <button class="btn btn-primary btn-sm" id="btn-checklist-${app.id}" style="flex: 2;">
          <span>📄</span> Document Checklist (${chk.completed}/${chk.total})
        </button>
        <a href="${s.application_url || s.provider_url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" title="Open Sponsor Application Portal">
          ↗
        </a>
        <button class="btn btn-outline btn-sm" id="btn-remove-app-${app.id}" title="Remove from Pipeline" style="color: var(--rose-text);">
          🗑️
        </button>
      </div>
    </div>
  `;
}
