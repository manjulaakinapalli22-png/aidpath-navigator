import { api } from '../api.js';
import { state } from '../state.js';

export function renderEligibility(container) {
  const profile = state.currentUser || {
    full_name: 'Visitor Student',
    role: 'student',
    gpa: 3.5,
    major: 'Computer Science',
    degree_level: 'Undergraduate',
    residency_status: 'US Citizen',
    household_income: 50000,
    is_first_generation: true,
  };

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <h2><span>⚡</span> Rule-Based Eligibility Explanations</h2>
        <p>Transparent evaluation breakdown comparing your academic, financial, and residency criteria against each award.</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-secondary" id="btn-edit-student-profile">
          <span>✏️</span> Edit Profile Criteria (What-If)
        </button>
      </div>
    </div>

    <!-- Active Student Profile Summary Rail -->
    <div class="profile-summary-banner">
      <div>
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Active Evaluation Profile</div>
        <strong style="color: var(--plum-900); font-size: 1.15rem;">${profile.full_name} (${profile.role})</strong>
      </div>
      <div class="profile-pills-row">
        <span class="student-attr-pill">GPA: ${profile.gpa ? parseFloat(profile.gpa).toFixed(2) : '3.50'}</span>
        <span class="student-attr-pill">Major: ${profile.major || 'Computer Science'}</span>
        <span class="student-attr-pill">Level: ${profile.degree_level || 'Undergraduate'}</span>
        <span class="student-attr-pill">Residency: ${profile.residency_status || 'US Citizen'}</span>
        <span class="student-attr-pill">Income: $${profile.household_income ? parseFloat(profile.household_income).toLocaleString() : '50,000'}/yr</span>
        ${profile.is_first_generation ? '<span class="student-attr-pill" style="background: var(--plum-50); color: var(--plum-700); border-color: var(--plum-200);">First-Gen Scholar</span>' : ''}
      </div>
    </div>

    <!-- Filter by Match Status -->
    <div style="display: flex; gap: 0.5rem; margin: 1.25rem 0; flex-wrap: wrap;" id="match-filter-buttons">
      <button class="stage-filter-btn active" data-match-filter="all">All Opportunities</button>
      <button class="stage-filter-btn" data-match-filter="ELIGIBLE">
        <span>✓</span> 100% Eligible
      </button>
      <button class="stage-filter-btn" data-match-filter="PARTIALLY_ELIGIBLE">
        <span>⚠️</span> Partially Eligible / Potential
      </button>
      <button class="stage-filter-btn" data-match-filter="INELIGIBLE">
        <span>✕</span> Ineligible
      </button>
    </div>

    <!-- Explanations Container -->
    <div id="eligibility-cards-container" class="eligibility-container">
      <div style="text-align: center; padding: 3rem;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 0.5rem; color: var(--text-muted);">Evaluating rules engine across curated directory...</p>
      </div>
    </div>
  `;

  // Attach profile edit click
  document.getElementById('btn-edit-student-profile')?.addEventListener('click', () => {
    document.getElementById('profile-edit-modal')?.classList.add('open');
  });

  // Attach filter clicks
  document.querySelectorAll('#match-filter-buttons button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#match-filter-buttons button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      filterRenderedCards(btn.dataset.matchFilter);
    });
  });

  // Fetch evaluations
  loadEvaluations();
}

let cachedEvaluations = [];

async function loadEvaluations() {
  const container = document.getElementById('eligibility-cards-container');
  if (!container) return;

  try {
    const res = await api.evaluateAll(state.currentUser);
    cachedEvaluations = res.data || [];

    if (cachedEvaluations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚡</div>
          <div class="empty-title">No scholarships available for evaluation</div>
          <p class="empty-desc">The directory is currently being updated. Check back soon.</p>
        </div>
      `;
      return;
    }

    renderEvaluationCards(cachedEvaluations);
  } catch (err) {
    container.innerHTML = `
      <div style="color: var(--rose-text); background: var(--rose-50); padding: 1.5rem; border-radius: var(--radius-lg);">
        Error evaluating rules: ${err.message}
      </div>
    `;
  }
}

function filterRenderedCards(filter) {
  if (filter === 'all') {
    renderEvaluationCards(cachedEvaluations);
  } else {
    const filtered = cachedEvaluations.filter((item) => item.eligibility.match_status === filter);
    renderEvaluationCards(filtered);
  }
}

function renderEvaluationCards(items) {
  const container = document.getElementById('eligibility-cards-container');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">No opportunities found for this status filter</div>
        <p class="empty-desc">Try selecting "All Opportunities" to see all evaluated scholarships.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map((item) => renderSingleExplanationCard(item)).join('');

  // Attach save opportunity click listeners
  items.forEach((item) => {
    document.getElementById(`btn-eval-save-${item.id}`)?.addEventListener('click', async () => {
      if (!state.currentUser || state.currentUser.role === 'visitor') {
        window.showToast('Select a student persona from the top bar to save opportunities.', 'warning');
        return;
      }
      try {
        await api.saveApplication(item.id, 'Saved from eligibility explanations.');
        window.showToast(`Saved "${item.title}" to your Application Pipeline!`, 'success');
        const appsRes = await api.getApplications();
        state.setApplications(appsRes.data || []);
      } catch (err) {
        window.showToast(err.message, 'error');
      }
    });
  });
}

function renderSingleExplanationCard(item) {
  const el = item.eligibility;
  const status = el.match_status.toLowerCase();

  let statusLabel = 'Eligible';
  let statusIcon = '✓';
  if (status === 'partially_eligible') {
    statusLabel = 'Partially Eligible';
    statusIcon = '⚠️';
  } else if (status === 'ineligible') {
    statusLabel = 'Ineligible';
    statusIcon = '✕';
  }

  return `
    <div class="explanation-card" id="eval-card-${item.id}">
      <div class="explanation-header">
        <div>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--plum-700); text-transform: uppercase;">
            ${item.provider_name}
          </span>
          <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--plum-950); margin-top: 0.2rem;">
            ${item.title}
          </h3>
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            Award: <strong style="color: var(--emerald-text); font-size: 1rem;">$${parseFloat(item.award_amount).toLocaleString()}</strong>
            &bull; Due: ${new Date(item.deadline).toLocaleDateString()}
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
          <div class="status-badge-large ${status}">
            <span>${statusIcon}</span>
            <span>${statusLabel} (${el.match_score}%)</span>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-eval-save-${item.id}">
            Save to Tracker
          </button>
        </div>
      </div>

      <div class="explanation-body">
        <p style="font-size: 0.92rem; color: var(--text-primary); margin-bottom: 0.75rem; font-weight: 500;">
          ${el.summary}
        </p>

        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">
          Itemized Rule Breakdown (${el.mandatory_passed}/${el.mandatory_total} Mandatory Criteria Met)
        </div>

        <!-- Rule Cards Grid -->
        <div class="rule-cards-grid">
          ${(el.explanations || [])
            .map(
              (rule) => `
            <div class="rule-item-card ${rule.status.toLowerCase()}">
              <div class="rule-item-header">
                <span class="rule-item-title">${rule.title}</span>
                <span class="rule-item-badge ${rule.status.toLowerCase()}">${rule.badge}</span>
              </div>
              <div class="rule-values-row">
                <span>Profile: <strong>${rule.user_value}</strong></span>
                <span>Rule: <strong>${rule.required_value}</strong></span>
              </div>
              <div class="rule-explanation-text">${rule.explanation}</div>
              ${rule.tip ? `<div class="rule-action-tip"><span>💡</span> <span>${rule.tip}</span></div>` : ''}
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
}
