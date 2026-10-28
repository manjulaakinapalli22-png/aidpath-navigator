import { api } from '../api.js';
import { state } from '../state.js';

export function setupProfileModal() {
  let modal = document.getElementById('profile-edit-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'profile-edit-modal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Edit Student Evaluation Profile</h3>
          <button class="modal-close-btn" id="btn-close-profile-modal">&times;</button>
        </div>
        <form id="profile-edit-form">
          <div class="modal-body">
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
              Adjust criteria to test "what-if" eligibility evaluations across all scholarships in real time.
            </p>

            <div class="form-group">
              <label>Full Name</label>
              <input type="text" id="prof-name" class="form-control" required />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label>Cumulative GPA (0.00 - 4.00)</label>
                <input type="number" step="0.01" min="0.0" max="4.0" id="prof-gpa" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Field of Study / Major</label>
                <select id="prof-major" class="form-control">
                  <option value="Computer Science">Computer Science</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Biology / Pre-Med">Biology / Pre-Med</option>
                  <option value="Nursing">Nursing</option>
                  <option value="Engineering">Engineering / Clean Tech</option>
                  <option value="Political Science">Political Science / Policy</option>
                  <option value="Economics">Economics</option>
                  <option value="All Majors">All Majors / General</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label>Degree Level</label>
                <select id="prof-degree-level" class="form-control">
                  <option value="High School Senior">High School Senior</option>
                  <option value="Undergraduate">Undergraduate</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Doctorate">Doctorate</option>
                </select>
              </div>
              <div class="form-group">
                <label>Residency Status</label>
                <select id="prof-residency" class="form-control">
                  <option value="US Citizen">US Citizen</option>
                  <option value="Permanent Resident">Permanent Resident</option>
                  <option value="DACA / Undocumented">DACA / Undocumented</option>
                  <option value="International">International</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Annual Household Income ($/yr)</label>
              <input type="number" step="1000" id="prof-income" class="form-control" placeholder="e.g. 52000" required />
              <div class="form-hint">Used to evaluate need-based caps and Pell grant alignments.</div>
            </div>

            <div style="display: flex; gap: 1.5rem; margin: 1rem 0;">
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; cursor: pointer;">
                <input type="checkbox" id="prof-first-gen" />
                <span>First-Generation College Student</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; cursor: pointer;">
                <input type="checkbox" id="prof-military" />
                <span>Military or Veteran Dependent</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" id="btn-cancel-profile">Cancel</button>
            <button type="submit" class="btn btn-primary">
              <span>💾</span> Save & Re-Evaluate Rules
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-close-profile-modal').onclick = () => modal.classList.remove('open');
    document.getElementById('btn-cancel-profile').onclick = () => modal.classList.remove('open');

    document.getElementById('profile-edit-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const name = document.getElementById('prof-name').value;
        const gpa = document.getElementById('prof-gpa').value;
        const major = document.getElementById('prof-major').value;
        const degreeLevel = document.getElementById('prof-degree-level').value;
        const residency = document.getElementById('prof-residency').value;
        const income = document.getElementById('prof-income').value;
        const firstGen = document.getElementById('prof-first-gen').checked;
        const military = document.getElementById('prof-military').checked;

        const res = await api.updateProfile({
          full_name: name,
          gpa: parseFloat(gpa),
          major: major,
          degree_level: degreeLevel,
          residency_status: residency,
          household_income: parseFloat(income),
          is_first_generation: firstGen,
          is_military_connected: military,
        });

        state.setCurrentUser(res.data);
        window.showToast('Profile updated! Re-evaluating eligibility...', 'success');
        modal.classList.remove('open');

        // Re-render eligibility view if active
        if (state.activeTab === 'eligibility') {
          const tabBtn = document.querySelector('[data-tab=eligibility]');
          if (tabBtn) tabBtn.click();
        }
      } catch (err) {
        window.showToast(err.message, 'error');
      }
    });
  }

  // Populate form with current user data when opened
  const editBtn = document.getElementById('btn-edit-profile');
  if (editBtn) {
    editBtn.onclick = () => {
      const u = state.currentUser || {};
      document.getElementById('prof-name').value = u.full_name || 'Student';
      document.getElementById('prof-gpa').value = u.gpa !== undefined ? u.gpa : 3.5;
      document.getElementById('prof-major').value = u.major || 'Computer Science';
      document.getElementById('prof-degree-level').value = u.degree_level || 'Undergraduate';
      document.getElementById('prof-residency').value = u.residency_status || 'US Citizen';
      document.getElementById('prof-income').value = u.household_income || 50000;
      document.getElementById('prof-first-gen').checked = Boolean(u.is_first_generation);
      document.getElementById('prof-military').checked = Boolean(u.is_military_connected);

      modal.classList.add('open');
    };
  }
}
