import { api } from './api.js';
import { state } from './state.js';
import { renderLanding } from './components/landing.js';
import { renderDirectory } from './components/directory.js';
import { renderEligibility } from './components/eligibility.js';
import { renderApplications } from './components/applications.js';
import { renderStaleReview } from './components/staleReview.js';
import { renderAdmin } from './components/admin.js';
import { setupProfileModal } from './components/profileModal.js';

// Global Toast Manager
window.showToast = function (message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Global Persona Selector Helper
window.selectPersona = async function (personaId) {
  const select = document.getElementById('persona-select');
  if (select) {
    select.value = personaId;
    select.dispatchEvent(new Event('change'));
  }
};

// Application Router / Tab Switcher
function switchTab(tabName) {
  state.setActiveTab(tabName);

  // Update tabs UI
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Render view
  const container = document.getElementById('main-content-view');
  if (!container) return;

  window.scrollTo({ top: 0, behavior: 'smooth' });

  switch (tabName) {
    case 'landing':
      renderLanding(container);
      break;
    case 'directory':
      renderDirectory(container);
      break;
    case 'eligibility':
      renderEligibility(container);
      break;
    case 'applications':
      renderApplications(container);
      break;
    case 'staleReview':
      renderStaleReview(container);
      break;
    case 'admin':
      renderAdmin(container);
      break;
    default:
      renderLanding(container);
  }
}

// Update UI based on User Persona Role
function updateRoleSpecificUI(user) {
  const roleBadge = document.getElementById('user-role-badge');
  if (roleBadge) {
    roleBadge.textContent = user.role.toUpperCase();
    roleBadge.className = `role-badge ${user.role}`;
  }

  // Show/Hide role specific tabs
  const staleTab = document.querySelector('[data-tab=staleReview]');
  const adminTab = document.querySelector('[data-tab=admin]');
  const appTab = document.querySelector('[data-tab=applications]');
  const editProfileBtn = document.getElementById('btn-edit-profile');

  const isStaff = user.role === 'operator' || user.role === 'admin';
  const isAdmin = user.role === 'admin';
  const isVisitor = user.role === 'visitor';

  if (staleTab) staleTab.style.display = isStaff ? 'flex' : 'none';
  if (adminTab) adminTab.style.display = isAdmin ? 'flex' : 'none';
  if (editProfileBtn) editProfileBtn.style.display = isVisitor ? 'none' : 'inline-flex';

  // If currently on a tab that is forbidden for new role, redirect
  if (state.activeTab === 'staleReview' && !isStaff) {
    switchTab('landing');
  } else if (state.activeTab === 'admin' && !isAdmin) {
    switchTab('landing');
  } else {
    // Re-render current active view with new role context
    switchTab(state.activeTab);
  }
}

// Check System & Database Health
async function checkHealthStatus() {
  try {
    const res = await api.getHealth();
    const dbInfo = res.database;
    const badge = document.getElementById('db-status-badge');
    if (badge) {
      if (dbInfo.supabase_connected) {
        badge.innerHTML = '🟢 Supabase PostgreSQL Live';
        badge.style.color = 'var(--emerald-text)';
      } else {
        badge.innerHTML = '🔵 Active Resilient Data Store (Seeded)';
        badge.style.color = 'var(--blue-700)';
      }
      badge.title = dbInfo.message;
    }
  } catch (err) {
    console.warn('Health check issue:', err);
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing AidPath Application...');

  // Setup toast container if needed
  if (!document.getElementById('toast-container')) {
    const tc = document.createElement('div');
    tc.id = 'toast-container';
    tc.className = 'toast-container';
    document.body.appendChild(tc);
  }

  // Navigation tab clicks
  document.querySelectorAll('.nav-tab').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = tab.dataset.tab;
      if (tabName) switchTab(tabName);
    });
  });

  // Setup Profile Modal
  setupProfileModal();

  // Load Personas and Set Active
  try {
    const personasRes = await api.getPersonas();
    const personas = personasRes.data || [];
    state.personas = personas;

    const personaSelect = document.getElementById('persona-select');
    if (personaSelect) {
      personaSelect.innerHTML = personas
        .map(
          (p) => `
        <option value="${p.id}" ${p.id === api.activeUserId ? 'selected' : ''}>
          ${p.full_name} (${p.role.toUpperCase()})
        </option>
      `
        )
        .join('');

      personaSelect.addEventListener('change', async (e) => {
        const selectedId = e.target.value;
        api.setActiveUser(selectedId);
        try {
          const userRes = await api.getCurrentUser();
          state.setCurrentUser(userRes.data);
          updateRoleSpecificUI(userRes.data);
          window.showToast(`Switched active persona to ${userRes.data.full_name} (${userRes.data.role.toUpperCase()})`, 'info');
        } catch (err) {
          window.showToast('Failed to switch persona.', 'error');
        }
      });
    }

    // Set initial user
    const initialUserRes = await api.getCurrentUser();
    state.setCurrentUser(initialUserRes.data);
    updateRoleSpecificUI(initialUserRes.data);
  } catch (err) {
    console.error('Error initializing user personas:', err);
  }

  // Check backend & DB health
  checkHealthStatus();

  // Initial tab render
  switchTab('landing');
});
