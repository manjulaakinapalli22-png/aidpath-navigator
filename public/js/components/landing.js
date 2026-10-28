import { api } from '../api.js';
import { state } from '../state.js';

export function renderLanding(container) {
  container.innerHTML = `
    <!-- Hero Banner -->
    <section class="hero-banner">
      <div class="hero-content">
        <div class="hero-tag">
          <span>✨</span>
          <span>Verified Scholarship & Deadline Navigator</span>
        </div>
        <h1 class="hero-title">
          Never Miss Life-Changing Aid Due to <span>Scattered Deadlines</span> or Opaque Rules.
        </h1>
        <p class="hero-description">
          AidPath brings together human-curated scholarships with transparent, rule-based eligibility explanations, real-time deadline countdowns, and personalized document preparation checklists.
        </p>
        <div class="view-actions" style="margin-top: 1.5rem;">
          <button class="btn btn-primary" id="btn-hero-explore">
            <span>🔍</span> Browse Verified Directory
          </button>
          <button class="btn btn-secondary" id="btn-hero-check">
            <span>⚡</span> Check My Eligibility
          </button>
        </div>
      </div>
    </section>

    <!-- Stat Counters Bar -->
    <section class="stats-grid" id="landing-stats-grid">
      <div class="stat-card">
        <div class="stat-icon-wrapper plum">🎓</div>
        <div>
          <div class="stat-value" id="landing-stat-funding">$84,500+</div>
          <div class="stat-label">Total Curated Funding</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper">📋</div>
        <div>
          <div class="stat-value" id="landing-stat-count">8</div>
          <div class="stat-label">Active Sourced Awards</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper emerald">🛡️</div>
        <div>
          <div class="stat-value" id="landing-stat-sla">100%</div>
          <div class="stat-label">Verified Source SLA</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon-wrapper amber">⏱️</div>
        <div>
          <div class="stat-value" id="landing-stat-deadlines">3</div>
          <div class="stat-label">Closing in &lt; 30 Days</div>
        </div>
      </div>
    </section>

    <!-- Profile -> Match -> Prepare -> Apply Progress Rail -->
    <section class="journey-rail-section">
      <div class="section-label">THE AIDPATH JOURNEY</div>
      <div class="journey-rail">
        <!-- Step 1: Profile -->
        <div class="journey-step-card">
          <div class="step-number">1</div>
          <h3 class="step-card-title">Profile</h3>
          <p class="step-card-desc">
            Define your academic standing, field of study, financial need, and demographic context in seconds.
          </p>
          <div class="step-card-action" id="rail-action-profile">
            <span>Configure Student Profile</span>
            <span>&rarr;</span>
          </div>
        </div>

        <!-- Step 2: Match -->
        <div class="journey-step-card">
          <div class="step-number">2</div>
          <h3 class="step-card-title">Match</h3>
          <p class="step-card-desc">
            Our transparent rule engine evaluates criteria with itemized explanation cards and pass/fail reasons.
          </p>
          <div class="step-card-action" id="rail-action-match">
            <span>View Rule Explanations</span>
            <span>&rarr;</span>
          </div>
        </div>

        <!-- Step 3: Prepare -->
        <div class="journey-step-card">
          <div class="step-number">3</div>
          <h3 class="step-card-title">Prepare</h3>
          <p class="step-card-desc">
            Track official transcripts, recommendation letters, essays, and FAFSA reports in an actionable checklist.
          </p>
          <div class="step-card-action" id="rail-action-prepare">
            <span>Open Document Tracker</span>
            <span>&rarr;</span>
          </div>
        </div>

        <!-- Step 4: Apply -->
        <div class="journey-step-card">
          <div class="step-number">4</div>
          <h3 class="step-card-title">Apply</h3>
          <p class="step-card-desc">
            Stay ahead with automated deadline urgency rails, progress stages, and direct source submission links.
          </p>
          <div class="step-card-action" id="rail-action-apply">
            <span>Manage Applications</span>
            <span>&rarr;</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive Quick Eligibility Calculator for Visitors -->
    <section class="landing-matcher-card">
      <div class="landing-matcher-title">⚡ Interactive Quick Eligibility Estimator</div>
      <p style="color: var(--text-secondary); font-size: 0.9rem;">
        Test your eligibility instantly without an account. See matched funding and transparent rule reasons.
      </p>

      <form id="quick-check-form" class="matcher-grid">
        <div class="form-group">
          <label>Cumulative GPA (0.0 - 4.0)</label>
          <input type="number" step="0.01" min="0" max="4.0" id="qc-gpa" class="form-control" value="3.65" required />
        </div>
        <div class="form-group">
          <label>Field of Study / Major</label>
          <select id="qc-major" class="form-control">
            <option value="Computer Science">Computer Science / Software</option>
            <option value="Biology / Pre-Med">Biology / Pre-Med</option>
            <option value="Engineering">Engineering / Clean Tech</option>
            <option value="Nursing">Nursing / Healthcare</option>
            <option value="Political Science">Political Science / Humanities</option>
            <option value="All Majors">All Majors / General</option>
          </select>
        </div>
        <div class="form-group">
          <label>Degree Standing</label>
          <select id="qc-level" class="form-control">
            <option value="Undergraduate">Undergraduate (College)</option>
            <option value="High School Senior">High School Senior</option>
            <option value="Graduate">Graduate / Master's</option>
          </select>
        </div>
        <div class="form-group">
          <label>Household Income ($/yr)</label>
          <input type="number" step="1000" id="qc-income" class="form-control" value="55000" />
        </div>
        <div class="form-group" style="display: flex; align-items: flex-end;">
          <button type="submit" class="btn btn-primary" style="width: 100%; height: 42px;">
            <span>✨ Calculate Matches</span>
          </button>
        </div>
      </form>

      <!-- Quick Check Results Container -->
      <div id="quick-check-results" style="display: none; margin-top: 1.5rem; border-top: 1px solid var(--surface-border); padding-top: 1.5rem;">
        <!-- Filled dynamically -->
      </div>
    </section>
  `;

  // Attach event listeners
  document.getElementById('btn-hero-explore').addEventListener('click', () => state.setActiveTab('directory'));
  document.getElementById('btn-hero-check').addEventListener('click', () => state.setActiveTab('eligibility'));

  document.getElementById('rail-action-profile').addEventListener('click', () => {
    document.getElementById('btn-edit-profile')?.click();
  });
  document.getElementById('rail-action-match').addEventListener('click', () => state.setActiveTab('eligibility'));
  document.getElementById('rail-action-prepare').addEventListener('click', () => state.setActiveTab('applications'));
  document.getElementById('rail-action-apply').addEventListener('click', () => state.setActiveTab('applications'));

  // Quick Check Form Handler
  const form = document.getElementById('quick-check-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultsContainer = document.getElementById('quick-check-results');
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 0.5rem; color: var(--text-muted); font-size: 0.9rem;">Evaluating rules across curated directory...</p>
      </div>
    `;

    try {
      const gpa = document.getElementById('qc-gpa').value;
      const major = document.getElementById('qc-major').value;
      const level = document.getElementById('qc-level').value;
      const income = document.getElementById('qc-income').value;

      const res = await api.quickCheck({
        gpa,
        major,
        degree_level: level,
        household_income: income,
        residency_status: 'US Citizen',
        is_first_generation: true,
      });

      const { matches, matches_count, potential_aid_total } = res.data;

      if (!matches || matches.length === 0) {
        resultsContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <div class="empty-title">No direct matches for this specific combination</div>
            <p class="empty-desc">Try broadening your major selection or checking merit-only awards in the full directory.</p>
            <button class="btn btn-secondary" onclick="document.querySelector('[data-tab=directory]').click()">
              Open Full Directory
            </button>
          </div>
        `;
        return;
      }

      resultsContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <strong style="color: var(--plum-900); font-size: 1.1rem;">Found ${matches_count} High-Potential Matches</strong>
            <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.5rem;">
              (Up to $${potential_aid_total.toLocaleString()} total potential aid)
            </span>
          </div>
          <button class="btn btn-sm btn-primary" onclick="document.querySelector('[data-tab=eligibility]').click()">
            View Full Rule Breakdown Cards &rarr;
          </button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem;">
          ${matches
            .map(
              (m) => `
            <div style="background: var(--surface-card-subtle); border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1rem; border-left: 4px solid var(--emerald-500);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--plum-700);">${m.provider_name}</span>
                <span style="font-weight: 800; color: var(--emerald-text);">$${parseFloat(m.award_amount).toLocaleString()}</span>
              </div>
              <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--plum-950); margin-bottom: 0.5rem;">${m.title}</h4>
              <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 0.75rem;">${m.eligibility.summary}</p>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
                <span class="role-badge student">${m.eligibility.match_score}% Match Score</span>
                <span style="color: var(--text-muted);">Due: ${new Date(m.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    } catch (err) {
      resultsContainer.innerHTML = `
        <div style="color: var(--rose-text); background: var(--rose-50); padding: 1rem; border-radius: var(--radius-md);">
          Error evaluating quick eligibility: ${err.message}
        </div>
      `;
    }
  });

  // Load live landing metrics
  loadLandingMetrics();
}

async function loadLandingMetrics() {
  try {
    const res = await api.getOperationalMetrics();
    const stats = res.data;
    if (stats) {
      const fundingElem = document.getElementById('landing-stat-funding');
      const countElem = document.getElementById('landing-stat-count');
      const slaElem = document.getElementById('landing-stat-sla');

      if (fundingElem) fundingElem.textContent = `$${stats.total_funding_available.toLocaleString()}`;
      if (countElem) countElem.textContent = stats.total_scholarships;
      if (slaElem) slaElem.textContent = `${stats.sla_compliance_rate}%`;
    }
  } catch (e) {
    // Keep defaults
  }
}
