import { boardData } from './state.js';

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.role = 'alert';

  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close" aria-label="Close notification">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  toast.querySelector('.toast-close').onclick = () => toast.remove();
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%) scale(0.9)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

export function renderBoard() {
  const columns = ['todo', 'inprogress', 'done'];

  columns.forEach(columnId => {
    const container = document.getElementById(`cards-${columnId}`);
    const badge = document.getElementById(`count-${columnId}`);
    
    if (!container) return;

    const cards = boardData[columnId] || [];

    if (badge) {
      badge.textContent = cards.length;
    }

    container.innerHTML = '';

 if (cards.length === 0) {
  container.innerHTML = `
    <div class="empty-placeholder">

      <div class="empty-icon">📋</div>

      <h4>No Tasks Found</h4>

      <p>Create your first task to get started.</p>

    </div>
  `;
  return;
}

    cards.forEach(cardData => {
      const card = document.createElement('article');
      card.className = 'card';
      card.id = cardData.id;
      card.draggable = true;

      card.innerHTML = `
        <div class="card-body">
          <div class="card-title-container">
            <h3 class="card-title">${escapeHTML(cardData.title)}</h3>
          </div>
          ${cardData.description ? `<p class="card-desc">${escapeHTML(cardData.description)}</p>` : ''}
          <div class="card-footer">
            <time class="card-time">${formatDate(cardData.createdAt)}</time>
            <div class="card-actions">
              <button class="action-btn edit-btn" data-action="edit" data-card-id="${cardData.id}" aria-label="Edit task">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="action-btn delete-btn" data-action="delete" data-card-id="${cardData.id}" aria-label="Delete task">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
