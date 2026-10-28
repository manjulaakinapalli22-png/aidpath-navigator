import { api } from '../api.js';

export async function openChecklistModal(savedScholarshipId, scholarshipTitle) {
  let modal = document.getElementById('document-checklist-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'document-checklist-modal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <div>
            <h3 class="modal-title" id="chk-modal-title">Document Checklist</h3>
            <span style="font-size: 0.82rem; color: var(--text-muted);" id="chk-modal-subtitle"></span>
          </div>
          <button class="modal-close-btn" id="chk-modal-close">&times;</button>
        </div>
        <div class="modal-body" id="chk-modal-body">
          <!-- Items populated dynamically -->
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="chk-modal-done">Done</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('chk-modal-close').onclick = () => modal.classList.remove('open');
    document.getElementById('chk-modal-done').onclick = () => {
      modal.classList.remove('open');
      // Trigger application list refresh if on applications tab
      const appsBtn = document.querySelector('[data-tab=applications]');
      if (appsBtn && appsBtn.classList.contains('active')) {
        appsBtn.click();
      }
    };
  }

  const modalBody = document.getElementById('chk-modal-body');
  const titleElem = document.getElementById('chk-modal-title');
  const subtitleElem = document.getElementById('chk-modal-subtitle');

  titleElem.textContent = `Document Checklist: ${scholarshipTitle}`;
  subtitleElem.textContent = 'Track transcripts, letters, and statements needed for submission.';

  modal.classList.add('open');
  modalBody.innerHTML = `
    <div style="text-align: center; padding: 2.5rem;">
      <div class="loading-spinner"></div>
      <p style="margin-top: 0.5rem; color: var(--text-muted);">Loading required documents...</p>
    </div>
  `;

  try {
    const res = await api.getChecklist(savedScholarshipId);
    const { items, summary } = res.data;

    if (!items || items.length === 0) {
      modalBody.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-title">No explicit document requirements found</div>
          <p class="empty-desc">This sponsor accepts direct application form inputs without external attachments.</p>
        </div>
      `;
      return;
    }

    renderChecklistBody(modalBody, savedScholarshipId, items, summary);
  } catch (err) {
    modalBody.innerHTML = `
      <div style="color: var(--rose-text); background: var(--rose-50); padding: 1.5rem; border-radius: var(--radius-md);">
        Error loading checklist: ${err.message}
      </div>
    `;
  }
}

function renderChecklistBody(container, savedScholarshipId, items, summary) {
  const percent = summary.percentage;

  container.innerHTML = `
    <!-- Top Progress Bar -->
    <div style="background: var(--surface-card-subtle); border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <div>
          <strong style="color: var(--plum-900); font-size: 0.95rem;">Application Readiness: ${percent}%</strong>
          <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;">(${summary.completed} of ${summary.total} documents complete)</span>
        </div>
        <span class="role-badge ${percent === 100 ? 'student' : 'operator'}">
          ${percent === 100 ? 'Ready to Submit!' : 'In Progress'}
        </span>
      </div>
      <div class="progress-track" style="height: 10px;">
        <div class="progress-bar ${percent === 100 ? 'complete' : ''}" style="width: ${percent}%;"></div>
      </div>
    </div>

    <!-- Document Items List -->
    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
      ${items
        .map((item) => {
          const doc = item.document_def;
          return `
          <div class="checklist-item-row" id="chk-row-${item.id}">
            <div class="checklist-doc-info">
              <div class="doc-name">
                <span>${doc.name}</span>
                <span class="role-badge ${doc.is_mandatory ? 'admin' : 'visitor'}" style="font-size: 0.65rem;">
                  ${doc.is_mandatory ? 'Mandatory' : 'Optional'}
                </span>
              </div>
              <div class="doc-desc">${doc.description}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
                ⏰ Lead Time: Request ~${doc.suggested_lead_time_days} days before deadline
              </div>

              ${
                item.file_name
                  ? `<div class="doc-file-tag">
                       <span>📎</span>
                       <span>${item.file_name}</span>
                     </div>`
                  : ''
              }
            </div>

            <div class="checklist-controls">
              <select class="doc-status-select ${item.status}" id="status-sel-${item.id}">
                <option value="missing" ${item.status === 'missing' ? 'selected' : ''}>❌ Missing</option>
                <option value="in_progress" ${item.status === 'in_progress' ? 'selected' : ''}>⏳ In Progress</option>
                <option value="ready" ${item.status === 'ready' ? 'selected' : ''}>✅ Ready / Prepared</option>
                <option value="submitted" ${item.status === 'submitted' ? 'selected' : ''}>🚀 Submitted</option>
              </select>

              <button class="btn btn-outline btn-sm" id="btn-edit-chk-${item.id}" title="Attach File / Notes">
                ✏️
              </button>
            </div>
          </div>
        `;
        })
        .join('')}
    </div>
  `;

  // Attach status change events
  items.forEach((item) => {
    const sel = document.getElementById(`status-sel-${item.id}`);
    sel?.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      try {
        await api.updateChecklistItem(item.id, { status: newStatus });
        sel.className = `doc-status-select ${newStatus}`;
        window.showToast('Document status updated!', 'success');
        // Refresh checklist summary
        const res = await api.getChecklist(savedScholarshipId);
        renderChecklistBody(container, savedScholarshipId, res.data.items, res.data.summary);
      } catch (err) {
        window.showToast(err.message, 'error');
        e.target.value = item.status;
      }
    });

    const editBtn = document.getElementById(`btn-edit-chk-${item.id}`);
    editBtn?.addEventListener('click', async () => {
      const fileName = prompt(
        `Attach Document for "${item.document_def.name}":\nEnter file name (e.g., Elena_Rostova_${item.document_def.name.replace(/[^a-zA-Z]/g, '')}.pdf):`,
        item.file_name || ''
      );

      if (fileName !== null) {
        const notes = prompt(`Add a progress note or reminder for "${item.document_def.name}":`, item.notes || '');
        const autoReady = fileName.trim().length > 0 ? 'ready' : item.status;
        try {
          await api.updateChecklistItem(item.id, {
            file_name: fileName.trim() || null,
            notes: notes !== null ? notes.trim() : item.notes,
            status: autoReady,
          });
          window.showToast('Checklist file & notes saved!', 'success');
          const res = await api.getChecklist(savedScholarshipId);
          renderChecklistBody(container, savedScholarshipId, res.data.items, res.data.summary);
        } catch (err) {
          window.showToast(err.message, 'error');
        }
      }
    });
  });
}
