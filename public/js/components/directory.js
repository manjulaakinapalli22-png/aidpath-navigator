import { api } from '../api.js';
import { state } from '../state.js';

export function renderDirectory(container) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-title">
        <h2><span>📚</span> Curated Sourced Scholarship Directory</h2>
        <p>Explore verified opportunities with transparent source links, audited requirements, and last-verified dates.</p>
      </div>
      <div class="view-actions">
        ${
          state.isStaffOrAdmin()
            ? `<button class="btn btn-warning" id="btn-dir-view-stale">
                 <span>⚠️</span> Review Stale Records (${state.staleRecords.length || 0})
               </button>`
            : ''
        }
        ${
          state.isAdmin()
            ? `<button class="btn btn-primary" id="btn-dir-add-scholarship">
                 <span>+</span> Curate New Scholarship
               </button>`
            : ''
        }
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="filter-bar-card">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input type="text" id="dir-search" class="form-control" placeholder="Search by title, foundation sponsor, major, or keywords..." />
      </div>

      <div class="filter-selects-row">
        <div class="filter-select-group">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">EDUCATION LEVEL</label>
          <select id="filter-level" class="form-control">
            <option value="all">All Levels</option>
            <option value="Undergraduate">Undergraduate</option>
            <option value="High School Senior">High School Senior</option>
            <option value="Graduate">Graduate</option>
          </select>
        </div>

        <div class="filter-select-group">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">MAJOR / DISCIPLINE</label>
          <select id="filter-major" class="form-control">
            <option value="all">All Disciplines</option>
            <option value="Computer Science">Computer Science / AI</option>
            <option value="Biology / Pre-Med">Biology / Pre-Med</option>
            <option value="Engineering">Engineering / Clean Tech</option>
            <option value="Nursing">Nursing / Health</option>
            <option value="Political Science">Civic / Policy</option>
          </select>
        </div>

        <div class="filter-select-group">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">FUNDING TYPE</label>
          <select id="filter-type" class="form-control">
            <option value="all">All Funding Types</option>
            <option value="need">Need-Based Only</option>
            <option value="merit">Merit-Based (No Income Cap)</option>
            <option value="renewable">Renewable Grants</option>
          </select>
        </div>

        <div class="filter-select-group">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">VERIFICATION STATUS</label>
          <select id="filter-verification" class="form-control">
            <option value="all">All Records</option>
            <option value="verified">Verified (&lt; 90 Days)</option>
            <option value="stale">Needs Re-Verification (Stale)</option>
          </select>
        </div>

        <div class="filter-select-group">
          <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">SORT BY</label>
          <select id="filter-sort" class="form-control">
            <option value="deadline">Closest Deadline</option>
            <option value="award_amount">Highest Award Amount</option>
            <option value="last_verified">Recently Verified</option>
            <option value="title">Scholarship Title (A-Z)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Results Grid Container -->
    <div id="directory-grid-container" class="scholarship-grid">
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 0.5rem; color: var(--text-muted);">Loading curated scholarships...</p>
      </div>
    </div>

    <!-- Scholarship Detail Modal Container -->
    <div id="scholarship-detail-modal" class="modal-backdrop">
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-sch-title">Scholarship Details</h3>
          <button class="modal-close-btn" onclick="document.getElementById('scholarship-detail-modal').classList.remove('open')">&times;</button>
        </div>
        <div class="modal-body" id="modal-sch-body">
          <!-- Populated dynamically -->
        </div>
        <div class="modal-footer" id="modal-sch-footer">
          <button class="btn btn-outline" onclick="document.getElementById('scholarship-detail-modal').classList.remove('open')">Close</button>
          <button class="btn btn-primary" id="modal-btn-save-opp">Save to Application Tracker</button>
        </div>
      </div>
    </div>
  `;

  // Attach search and filter events
  const searchInput = document.getElementById('dir-search');
  const levelSelect = document.getElementById('filter-level');
  const majorSelect = document.getElementById('filter-major');
  const typeSelect = document.getElementById('filter-type');
  const verifSelect = document.getElementById('filter-verification');
  const sortSelect = document.getElementById('filter-sort');

  const reload = () => fetchAndRenderDirectory();

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(reload, 300);
  });
  levelSelect.addEventListener('change', reload);
  majorSelect.addEventListener('change', reload);
  typeSelect.addEventListener('change', reload);
  verifSelect.addEventListener('change', reload);
  sortSelect.addEventListener('change', reload);

  document.getElementById('btn-dir-view-stale')?.addEventListener('click', () => {
    state.setActiveTab('staleReview');
  });

  document.getElementById('btn-dir-add-scholarship')?.addEventListener('click', () => {
    document.getElementById('admin-new-scholarship-modal')?.classList.add('open');
  });

  // Initial fetch
  fetchAndRenderDirectory();
}

async function fetchAndRenderDirectory() {
  const container = document.getElementById('directory-grid-container');
  if (!container) return;

  const search = document.getElementById('dir-search')?.value;
  const level = document.getElementById('filter-level')?.value;
  const major = document.getElementById('filter-major')?.value;
  const type = document.getElementById('filter-type')?.value;
  const verification = document.getElementById('filter-verification')?.value;
  const sort = document.getElementById('filter-sort')?.value;

  const params = {
    search,
    education_level: level,
    major: major,
    verification_status: verification,
    sort_by: sort,
  };

  if (type === 'need') params.need_based = 'true';
  if (type === 'merit') params.need_based = 'false';
  if (type === 'renewable') params.renewable = 'true';

  try {
    const res = await api.getScholarships(params);
    const scholarships = res.data || [];
    state.setScholarships(scholarships);

    if (scholarships.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">No scholarships match your filters</div>
          <p class="empty-desc">Try resetting your search query or selecting "All Levels" and "All Disciplines".</p>
          <button class="btn btn-secondary" id="btn-reset-filters">Reset Filters</button>
        </div>
      `;
      document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
        document.getElementById('dir-search').value = '';
        document.getElementById('filter-level').value = 'all';
        document.getElementById('filter-major').value = 'all';
        document.getElementById('filter-type').value = 'all';
        document.getElementById('filter-verification').value = 'all';
        document.getElementById('filter-sort').value = 'deadline';
        fetchAndRenderDirectory();
      });
      return;
    }

    container.innerHTML = scholarships.map((s) => renderScholarshipCard(s)).join('');

    // Attach click listeners to cards
    scholarships.forEach((s) => {
      document.getElementById(`btn-details-${s.id}`)?.addEventListener('click', () => openDetailModal(s.id));
      document.getElementById(`btn-save-${s.id}`)?.addEventListener('click', () => handleSaveScholarship(s.id, s.title));
      document.getElementById(`btn-verify-now-${s.id}`)?.addEventListener('click', () => openQuickVerifyModal(s));
    });
  } catch (err) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; color: var(--rose-text); background: var(--rose-50); padding: 1.5rem; border-radius: var(--radius-lg);">
        Failed to load scholarships: ${err.message}
      </div>
    `;
  }
}

function renderScholarshipCard(s) {
  const isStale = s.is_stale || s.verification_status === 'flagged_stale';
  const deadlineDate = new Date(s.deadline);
  const daysUntilDeadline = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));

  let deadlineClass = 'upcoming';
  let deadlineLabel = `${daysUntilDeadline}d left`;
  if (daysUntilDeadline < 0) {
    deadlineClass = 'critical';
    deadlineLabel = 'Passed';
  } else if (daysUntilDeadline <= 7) {
    deadlineClass = 'critical';
    deadlineLabel = `Urgent (${daysUntilDeadline}d)`;
  } else if (daysUntilDeadline <= 20) {
    deadlineClass = 'urgent';
    deadlineLabel = `${daysUntilDeadline}d left`;
  }

  const verifiedDateStr = s.last_verified_at ? new Date(s.last_verified_at).toLocaleDateString() : 'Unrecorded';

  return `
    <div class="scholarship-card ${isStale ? 'stale-card' : ''}" id="card-${s.id}">
      <div class="card-header-row">
        <div class="provider-info">
          <span>🏛️</span>
          <span>${s.provider_name}</span>
        </div>
        <div class="award-badge">
          $${parseFloat(s.award_amount).toLocaleString()}
          ${s.is_renewable ? '<span style="font-size: 0.68rem; font-weight: 600; display: block; color: var(--emerald-text);">Renewable</span>' : ''}
        </div>
      </div>

      <h3 class="scholarship-card-title">${s.title}</h3>
      <p class="scholarship-description">${s.description}</p>

      <div class="criteria-tags">
        ${s.min_gpa ? `<span class="pill-tag merit">Min ${s.min_gpa} GPA</span>` : '<span class="pill-tag">No Min GPA</span>'}
        <span class="pill-tag">${s.education_levels.join(', ')}</span>
        <span class="pill-tag">${s.eligible_majors[0] || 'All Majors'}</span>
        ${s.need_based ? '<span class="pill-tag need">Need-Based</span>' : '<span class="pill-tag merit">Merit</span>'}
      </div>

      <!-- Verification & Deadline Meta Bar -->
      <div class="card-meta-bar">
        <div class="meta-row">
          <div class="verified-indicator ${isStale ? 'stale' : ''}">
            <span>${isStale ? '⚠️' : '✓'}</span>
            <span>${isStale ? `Stale: Unverified ${s.days_since_verified || 90}+ days` : `Verified: ${verifiedDateStr}`}</span>
          </div>
          <div class="deadline-pill ${deadlineClass}">
            📅 ${deadlineLabel}
          </div>
        </div>
        <div class="meta-row" style="font-size: 0.72rem; color: var(--text-muted);">
          <span>Source: <a href="${s.provider_url}" target="_blank" rel="noopener noreferrer" style="color: var(--blue-700);">Official Portal ↗</a></span>
          <span>By: ${s.verified_by_name || 'System Curator'}</span>
        </div>
      </div>

      <div class="card-footer-actions">
        <button class="btn btn-outline btn-sm" id="btn-details-${s.id}" style="flex: 1;">
          Details & Rules
        </button>
        <button class="btn btn-primary btn-sm" id="btn-save-${s.id}" style="flex: 1;">
          Save Opportunity
        </button>
        ${
          state.isStaffOrAdmin() && isStale
            ? `<button class="btn btn-warning btn-sm" id="btn-verify-now-${s.id}" title="Operator Re-verify">
                 Verify
               </button>`
            : ''
        }
      </div>
    </div>
  `;
}

async function openDetailModal(scholarshipId) {
  const modal = document.getElementById('scholarship-detail-modal');
  const modalBody = document.getElementById('modal-sch-body');
  const modalTitle = document.getElementById('modal-sch-title');
  const saveBtn = document.getElementById('modal-btn-save-opp');

  modal.classList.add('open');
  modalBody.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <div class="loading-spinner"></div>
      <p style="margin-top: 0.5rem; color: var(--text-muted);">Loading scholarship requirements & documents...</p>
    </div>
  `;

  try {
    const res = await api.getScholarshipById(scholarshipId);
    const s = res.data;

    modalTitle.textContent = s.title;

    // Check user's eligibility for this scholarship
    let evalHtml = '';
    if (state.currentUser && state.currentUser.role !== 'visitor') {
      try {
        const evalRes = await api.checkSingle(scholarshipId, state.currentUser);
        const evalData = evalRes.evaluation;
        evalHtml = `
          <div style="background: var(--plum-50); border: 1px solid var(--plum-100); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <strong style="color: var(--plum-900);">Your Personalized Eligibility Match</strong>
              <span class="role-badge ${evalData.match_status === 'ELIGIBLE' ? 'student' : evalData.match_status === 'PARTIALLY_ELIGIBLE' ? 'operator' : 'admin'}">
                ${evalData.match_status.replace('_', ' ')} (${evalData.match_score}%)
              </span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">${evalData.summary}</p>
          </div>
        `;
      } catch (e) {
        // Silent fallback
      }
    }

    modalBody.innerHTML = `
      ${evalHtml}

      <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
        <div>
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Sponsor Organization</span>
          <h4 style="color: var(--plum-900); font-size: 1.1rem;">${s.provider_name}</h4>
          <a href="${s.provider_url}" target="_blank" rel="noopener noreferrer" style="font-size: 0.82rem; color: var(--blue-700);">
            Visit Sponsor Website ↗
          </a>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Award Value</span>
          <h3 style="color: var(--emerald-text); font-size: 1.4rem; font-weight: 800;">$${parseFloat(s.award_amount).toLocaleString()}</h3>
          <span style="font-size: 0.78rem; color: var(--text-secondary);">${s.is_renewable ? s.renewable_details : 'One-time disbursement'}</span>
        </div>
      </div>

      <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.25rem;">
        ${s.description}
      </p>

      <div style="margin-bottom: 1.5rem;">
        <h4 style="color: var(--plum-900); font-size: 0.95rem; margin-bottom: 0.5rem;">Mandatory Eligibility Criteria</h4>
        <div style="background: var(--surface-card-subtle); border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 0.85rem;">
          <ul style="padding-left: 1.2rem; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
            <li><strong>Minimum GPA:</strong> ${s.min_gpa ? `${s.min_gpa} on a 4.0 scale` : 'None required'}</li>
            <li><strong>Degree Standing:</strong> ${s.education_levels.join(', ')}</li>
            <li><strong>Eligible Majors:</strong> ${s.eligible_majors.join(', ')}</li>
            <li><strong>Residency:</strong> ${s.residency_requirements.join(', ')}</li>
            <li><strong>Financial Need:</strong> ${s.need_based ? `Need-based (Max Household Income: $${s.max_household_income ? s.max_household_income.toLocaleString() : 'Pell/Need'})` : 'Merit-based (Open to all income levels)'}</li>
            ${s.demographic_criteria?.length ? `<li><strong>Demographic Focus:</strong> ${s.demographic_criteria.join(', ')}</li>` : ''}
          </ul>
        </div>
      </div>

      <div>
        <h4 style="color: var(--plum-900); font-size: 0.95rem; margin-bottom: 0.5rem;">Required Application Documents</h4>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          ${(s.documents || [])
            .map(
              (doc) => `
            <div style="background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); padding: 0.65rem 0.85rem; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 0.85rem; color: var(--plum-900);">${doc.name}</strong>
                <p style="font-size: 0.78rem; color: var(--text-secondary);">${doc.description}</p>
              </div>
              <span class="role-badge ${doc.is_mandatory ? 'admin' : 'visitor'}">
                ${doc.is_mandatory ? 'Mandatory' : 'Optional'}
              </span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;

    // Configure save button in modal
    saveBtn.onclick = () => {
      modal.classList.remove('open');
      handleSaveScholarship(s.id, s.title);
    };
  } catch (err) {
    modalBody.innerHTML = `<div style="color: var(--rose-text);">Error loading details: ${err.message}</div>`;
  }
}

async function handleSaveScholarship(scholarshipId, title) {
  if (!state.currentUser || state.currentUser.role === 'visitor') {
    window.showToast('Please select a student persona from the top bar to save scholarships.', 'warning');
    return;
  }

  try {
    const res = await api.saveApplication(scholarshipId, 'Saved from directory.');
    window.showToast(`Saved "${title}" to your Application Pipeline!`, 'success');
    // Refresh application state
    const appsRes = await api.getApplications();
    state.setApplications(appsRes.data || []);
  } catch (err) {
    window.showToast(err.message, 'error');
  }
}

function openQuickVerifyModal(scholarship) {
  state.setActiveTab('staleReview');
}
