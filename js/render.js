/**
 * DOM Rendering and UI Helper Module
 * Optimized to reduce DOM reflows and prevent XSS injections.
 */

/**
 * Format ISO Date string into a human-readable date.
 */
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

/**
 * Creates a toast notification on the screen.
 * @param {string} message - Message text
 * @param {'success'|'error'|'info'} type - Type of alert
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.role = 'alert';

  const textNode = document.createElement('span');
  textNode.textContent = message;
  toast.appendChild(textNode);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.ariaLabel = 'Close notification';
  closeBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  closeBtn.onclick = () => toast.remove();
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  // Auto-remove toast after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%) scale(0.9)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Renders a single card component.
 * Uses safe textContent to prevent cross-site scripting (XSS).
 * @param {Object} cardData - The task object from state
 * @returns {HTMLElement} The card element
 */
function createCardElement(cardData) {
  const card = document.createElement('article');
  card.className = 'card';
  card.id = cardData.id;
  card.setAttribute('draggable', 'true');
  card.setAttribute('aria-grabbed', 'false');

  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';

  const titleContainer = document.createElement('div');
  titleContainer.className = 'card-title-container';

  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = cardData.title;
  titleContainer.appendChild(title);
  cardBody.appendChild(titleContainer);

  if (cardData.description) {
    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = cardData.description;
    cardBody.appendChild(desc);
  }

  const footer = document.createElement('div');
  footer.className = 'card-footer';

  const time = document.createElement('time');
  time.className = 'card-time';
  time.dateTime = cardData.createdAt;
  time.textContent = formatDate(cardData.createdAt);
  footer.appendChild(time);

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  // Edit Action Button
  const editBtn = document.createElement('button');
  editBtn.className = 'action-btn edit-btn';
  editBtn.ariaLabel = 'Edit task';
  editBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  `;
  editBtn.setAttribute('data-action', 'edit');
  editBtn.setAttribute('data-card-id', cardData.id);
  actions.appendChild(editBtn);

  // Delete Action Button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'action-btn delete-btn';
  deleteBtn.ariaLabel = 'Delete task';
  deleteBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  `;
  deleteBtn.setAttribute('data-action', 'delete');
  deleteBtn.setAttribute('data-card-id', cardData.id);
  actions.appendChild(deleteBtn);

  footer.appendChild(actions);
  cardBody.appendChild(footer);
  card.appendChild(cardBody);

  return card;
}

/**
 * Replaces a card with an inline form editor.
 * @param {HTMLElement} cardEl - The card element to convert
 * @param {Object} cardData - Original card state info
 */
export function enterEditMode(cardEl, cardData) {
  cardEl.classList.add('editing');
  cardEl.setAttribute('draggable', 'false');

  const formWrapper = document.createElement('form');
  formWrapper.className = 'card-form';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'card-input title-input';
  titleInput.value = cardData.title;
  titleInput.required = true;
  titleInput.maxLength = 100;
  formWrapper.appendChild(titleInput);

  const descInput = document.createElement('textarea');
  descInput.className = 'card-input desc-input';
  descInput.value = cardData.description || '';
  descInput.placeholder = 'Description (optional)...';
  descInput.rows = 2;
  descInput.maxLength = 500;
  formWrapper.appendChild(descInput);

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Save';
  actions.appendChild(saveBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  actions.appendChild(cancelBtn);

  formWrapper.appendChild(actions);

  // Replace content inside card
  cardEl.innerHTML = '';
  cardEl.appendChild(formWrapper);
  titleInput.focus();

  return { formWrapper, titleInput, descInput, cancelBtn };
}

/**
 * Renders the entire state into columns.
 * Optimizes DOM operations using DocumentFragments to minimize reflow triggers.
 * @param {Object} boardState - Current application state representation
 */
export function renderBoard(boardState) {
  for (const columnId in boardState) {
    const container = document.getElementById(`cards-${columnId}`);
    const badge = document.getElementById(`count-${columnId}`);
    
    if (!container) continue;

    const cards = boardState[columnId];

    // Update column badge count
    if (badge) {
      badge.textContent = cards.length;
    }

    // Clear column cards
    container.innerHTML = '';

    if (cards.length === 0) {
      // Append an empty indicator placeholder
      const placeholder = document.createElement('div');
      placeholder.className = 'empty-placeholder';
      placeholder.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        <span>No tasks here yet</span>
      `;
      container.appendChild(placeholder);
      continue;
    }

    // Create a DocumentFragment to accumulate all card elements
    // This allows appending all cards to the DOM in a single redraw operation
    const fragment = document.createDocumentFragment();

    cards.forEach(cardData => {
      const cardEl = createCardElement(cardData);
      fragment.appendChild(cardEl);
    });

    container.appendChild(fragment);
  }
}
