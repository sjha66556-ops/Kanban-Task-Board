/**
 * Core Application Bootstrap and Event Delegation Manager
 */

import { store } from './state.js';
import { renderBoard, enterEditMode, showToast } from './render.js';
import { initDragAndDrop } from './dragdrop.js';

// Tracks current card ID being edited inline
let activeEditingCardId = null;

/**
 * Shows the task creation form for a specific column and hides others.
 * @param {string} columnId - The column ID ('todo' | 'inprogress' | 'done')
 */
function toggleAddForm(columnId, forceShow = null) {
  const formWrapper = document.getElementById(`form-${columnId}`);
  if (!formWrapper) return;

  const isHidden = formWrapper.classList.contains('hidden');
  const shouldShow = forceShow !== null ? forceShow : isHidden;

  // Close all forms first to keep visual sanity
  document.querySelectorAll('.card-form-wrapper').forEach(wrapper => {
    wrapper.classList.add('hidden');
    const form = wrapper.querySelector('form');
    if (form) form.reset();
  });

  if (shouldShow) {
    formWrapper.classList.remove('hidden');
    const firstInput = formWrapper.querySelector('.title-input');
    if (firstInput) firstInput.focus();
  }
}

/**
 * Initial setup of event delegators and listeners.
 */
function setupEventHandlers() {
  const board = document.querySelector('.board-container');
  if (!board) return;

  // 1. Column Add Button Toggles
  document.querySelectorAll('.add-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const colId = btn.dataset.column;
      toggleAddForm(colId);
    });
  });

  // 2. Column Cancel Button Toggles
  document.querySelectorAll('.cancel-form-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const colId = btn.dataset.column;
      toggleAddForm(colId, false);
    });
  });

  // 3. Card Create Form Submissions
  document.querySelectorAll('.card-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const colId = form.dataset.column;
      const titleInput = form.querySelector('.title-input');
      const descInput = form.querySelector('.desc-input');

      const title = titleInput.value.trim();
      const description = descInput.value.trim();

      try {
        store.addCard(colId, title, description);
        
        // Reset and hide form
        form.reset();
        toggleAddForm(colId, false);
        
        showToast('Task added successfully', 'success');
      } catch (error) {
        // Error handling is display-friendly and handled in state listener / caught here
        // (the store already dispatches 'board-error' custom event)
      }
    });
  });

  // 4. Global Action Event Delegation (Edit, Delete, and double click to edit)
  board.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');

    // Handle Edit Action
    if (editBtn) {
      const cardId = editBtn.dataset.cardId;
      startCardInlineEdit(cardId);
      return;
    }

    // Handle Delete Action
    if (deleteBtn) {
      const cardId = deleteBtn.dataset.cardId;
      if (confirm('Are you sure you want to delete this task?')) {
        try {
          store.deleteCard(cardId);
          showToast('Task deleted successfully', 'success');
        } catch (error) {
          // Toast is shown automatically by store error listener
        }
      }
      return;
    }
  });

  // 5. Double Click on Card to Edit
  board.addEventListener('dblclick', (e) => {
    const cardEl = e.target.closest('.card');
    if (cardEl && !cardEl.classList.contains('editing')) {
      startCardInlineEdit(cardEl.id);
    }
  });

  // 6. Clear Board Action Button
  const clearBtn = document.getElementById('clear-board-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      // Check if board is already empty
      const state = store.getState();
      const isEmpty = state.todo.length === 0 && 
                      state.inprogress.length === 0 && 
                      state.done.length === 0;

      if (isEmpty) {
        showToast('Board is already clear.', 'info');
        return;
      }

      if (confirm('Are you sure you want to delete all tasks on this board? This action cannot be undone.')) {
        store.clearAll();
        showToast('Board cleared successfully', 'success');
      }
    });
  }

  // 7. Global State Error Handler
  window.addEventListener('board-error', (e) => {
    showToast(e.detail.message, 'error');
  });
}

/**
 * Enters inline edit mode for a specific card element.
 * @param {string} cardId - The target card ID to edit
 */
function startCardInlineEdit(cardId) {
  // If editing another card, close it by rendering the board first
  if (activeEditingCardId && activeEditingCardId !== cardId) {
    renderBoard(store.getState());
  }

  const cardEl = document.getElementById(cardId);
  if (!cardEl) return;

  // Retrieve card state
  const state = store.getState();
  let cardData = null;
  
  for (const colId in state) {
    cardData = state[colId].find(card => card.id === cardId);
    if (cardData) break;
  }

  if (!cardData) return;

  activeEditingCardId = cardId;

  // Enter edit mode
  const { formWrapper, titleInput, descInput, cancelBtn } = enterEditMode(cardEl, cardData);

  // Bind inline edit handlers
  cancelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    activeEditingCardId = null;
    // Discarding and reloading from store
    renderBoard(store.getState());
  });

  formWrapper.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const newTitle = titleInput.value.trim();
    const newDesc = descInput.value.trim();

    try {
      store.updateCard(cardId, { title: newTitle, description: newDesc });
      activeEditingCardId = null;
      showToast('Task updated successfully', 'success');
    } catch (error) {
      // Errors are caught and handled by toast listener
    }
  });

  // Add click-outside listener to discard edits
  const clickOutsideHandler = (e) => {
    if (!cardEl.contains(e.target)) {
      document.removeEventListener('click', clickOutsideHandler);
      if (activeEditingCardId === cardId) {
        activeEditingCardId = null;
        renderBoard(store.getState());
      }
    }
  };
  
  // Delay slightly to prevent click event propagation triggering immediately
  setTimeout(() => {
    document.addEventListener('click', clickOutsideHandler);
  }, 100);
}

/**
 * Bootstrap application
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Setup subscription so render updates automatically on state changes
  store.subscribe((state) => {
    renderBoard(state);
    // Re-initialize drag and drop since elements are re-created
    initDragAndDrop();
  });

  // 2. Initial Draw
  renderBoard(store.getState());

  // 3. Setup Drag and Drop
  initDragAndDrop();

  // 4. Bind static events
  setupEventHandlers();
});
