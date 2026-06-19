/**
 * Native HTML5 Drag and Drop Interaction Module
 * Employs event delegation on column structures to avoid memory leaks.
 */

import { store } from './state.js';
import { showToast } from './render.js';

// Global reference of the card being dragged
let draggedCardEl = null;
let sourceColumnId = null;

// Track drag enter counts per column to prevent flicker when hovering over cards
const dragEnterCounters = {
  todo: 0,
  inprogress: 0,
  done: 0
};

/**
 * Calculates the drop index inside a container based on the mouse pointer position.
 * @param {HTMLElement} container - The column card container element
 * @param {number} y - The screen Y coordinate of the mouse pointer
 * @returns {Object} { index: number, afterElement: HTMLElement|null }
 */
function getDropPosition(container, y) {
  // Get all cards in this container except the one currently dragging
  const draggableElements = [...container.querySelectorAll('.card:not(.editing):not(.dragging)')];

  let closestElement = null;
  let closestOffset = Number.NEGATIVE_INFINITY;
  let targetIndex = draggableElements.length;

  for (let i = 0; i < draggableElements.length; i++) {
    const child = draggableElements[i];
    const box = child.getBoundingClientRect();
    // Offset is negative when mouse is above the middle of the element
    const offset = y - (box.top + box.height / 2);

    if (offset < 0 && offset > closestOffset) {
      closestOffset = offset;
      closestElement = child;
      targetIndex = i;
    }
  }

  return {
    index: targetIndex,
    afterElement: closestElement
  };
}

/**
 * Setup drag & drop listeners on the columns.
 * Employs delegation for performance and clean DOM manipulation.
 */
export function initDragAndDrop() {
  const board = document.querySelector('.board-container');
  if (!board) return;

  // 1. DRAG START (Delegated from card)
  board.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.card');
    if (!card || card.classList.contains('editing')) {
      e.preventDefault();
      return;
    }

    draggedCardEl = card;
    card.classList.add('dragging');
    card.setAttribute('aria-grabbed', 'true');
    
    // Track source column
    const column = card.closest('.column');
    sourceColumnId = column ? column.dataset.columnId : null;

    // Set dragging transfer data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
  });

  // 2. DRAG END (Delegated from card)
  board.addEventListener('dragend', (e) => {
    const card = e.target.closest('.card');
    if (card) {
      card.classList.remove('dragging');
      card.setAttribute('aria-grabbed', 'false');
    }
    
    // Clear styles from all columns
    document.querySelectorAll('.column').forEach(col => {
      col.classList.remove('drag-over');
      const colId = col.dataset.columnId;
      if (colId) dragEnterCounters[colId] = 0;
    });

    draggedCardEl = null;
    sourceColumnId = null;
  });

  // Attach column drop-zone listeners
  const columns = document.querySelectorAll('.column');
  columns.forEach(column => {
    const columnId = column.dataset.columnId;
    const cardsContainer = column.querySelector('.cards-container');

    if (!cardsContainer) return;

    // 3. DRAG OVER
    column.addEventListener('dragover', (e) => {
      e.preventDefault(); // Required to allow drop event
      e.dataTransfer.dropEffect = 'move';
    });

    // 4. DRAG ENTER
    column.addEventListener('dragenter', (e) => {
      e.preventDefault();
      
      dragEnterCounters[columnId]++;
      if (dragEnterCounters[columnId] === 1) {
        column.classList.add('drag-over');
      }
    });

    // 5. DRAG LEAVE
    column.addEventListener('dragleave', (e) => {
      dragEnterCounters[columnId] = Math.max(0, dragEnterCounters[columnId] - 1);
      if (dragEnterCounters[columnId] === 0) {
        column.classList.remove('drag-over');
      }
    });

    // 6. DROP
    column.addEventListener('drop', (e) => {
      e.preventDefault();

      // Reset counter and styles
      dragEnterCounters[columnId] = 0;
      column.classList.remove('drag-over');

      const cardId = e.dataTransfer.getData('text/plain');
      if (!cardId || !sourceColumnId) return;

      // Find drop index based on pointer coordinate
      const { index } = getDropPosition(cardsContainer, e.clientY);

      // Perform state action
      try {
        if (sourceColumnId === columnId) {
          // If moving in same column, account for removal offset
          const cards = store.getState()[columnId];
          const oldIndex = cards.findIndex(c => c.id === cardId);
          
          if (oldIndex !== -1 && oldIndex !== index && oldIndex !== index - 1) {
            // Adjust index to accommodate card removal
            const adjustedIndex = oldIndex < index ? index - 1 : index;
            store.moveCard(cardId, sourceColumnId, columnId, adjustedIndex);
          }
        } else {
          // Column cross move
          store.moveCard(cardId, sourceColumnId, columnId, index);
          
          // Success toast
          const colName = column.querySelector('h2').textContent;
          showToast(`Task moved to ${colName}`, 'success');
        }
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  });
}
