import { boardData, loadTasks, addTask, updateTask, deleteTask, clearAllTasks } from './state.js';
import { renderBoard, showToast } from './render.js';
import { initDragAndDrop } from './dragdrop.js';

let editingTaskId = null;

function toggleForm(columnId, show = true) {
  const formWrapper = document.getElementById(`form-${columnId}`);
  if (!formWrapper) return;

  document.querySelectorAll('.card-form-wrapper').forEach(el => {
    el.classList.add('hidden');
    const form = el.querySelector('form');
    if (form) form.reset();
  });

  if (show) {
    formWrapper.classList.remove('hidden');
    const input = formWrapper.querySelector('.title-input');
    if (input) input.focus();
  }
}

function setupListeners() {
  const board = document.querySelector('.board-container');
  if (!board) return;

  document.querySelectorAll('.add-card-btn').forEach(btn => {
    btn.onclick = () => {
      const colId = btn.dataset.column;
      toggleForm(colId, true);
    };
  });

  document.querySelectorAll('.cancel-form-btn').forEach(btn => {
    btn.onclick = () => {
      const colId = btn.dataset.column;
      toggleForm(colId, false);
    };
  });

  document.querySelectorAll('.card-form').forEach(form => {
    form.onsubmit = (e) => {
      e.preventDefault();
      const colId = form.dataset.column;
      const titleInput = form.querySelector('.title-input');
      const descInput = form.querySelector('.desc-input');

      const title = titleInput.value.trim();
      const desc = descInput.value.trim();

      if (!title) {
        showToast('Please enter a title', 'error');
        return;
      }

      addTask(colId, title, desc);
      form.reset();
      toggleForm(colId, false);
      renderBoard();
      showToast('Task added successfully!', 'success');
    };
  });

  board.onclick = (e) => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');

    if (editBtn) {
      const taskId = editBtn.dataset.cardId;
      startEditing(taskId);
      return;
    }

    if (deleteBtn) {
      const taskId = deleteBtn.dataset.cardId;
      if (confirm('Are you sure you want to delete this task?')) {
        deleteTask(taskId);
        renderBoard();
        showToast('Task deleted successfully', 'success');
      }
      return;
    }
  };

  board.ondblclick = (e) => {
    const card = e.target.closest('.card');
    if (card && !card.classList.contains('editing')) {
      startEditing(card.id);
    }
  };

  const clearBtn = document.getElementById('clear-board-btn');
  if (clearBtn) {
    clearBtn.onclick = () => {
      const isEmpty = boardData.todo.length === 0 &&
                      boardData.inprogress.length === 0 &&
                      boardData.done.length === 0;

      if (isEmpty) {
        showToast('Board is already empty', 'info');
        return;
      }

      if (confirm('Are you sure you want to delete all tasks on this board? This action cannot be undone.')) {
        clearAllTasks();
        renderBoard();
        showToast('Board cleared successfully', 'success');
      }
    };
  }
}

function startEditing(taskId) {
  if (editingTaskId) {
    renderBoard();
  }

  const cardEl = document.getElementById(taskId);
  if (!cardEl) return;

  let task = null;
  for (let col in boardData) {
    task = boardData[col].find(t => t.id === taskId);
    if (task) break;
  }
  if (!task) return;

  editingTaskId = taskId;
  cardEl.classList.add('editing');
  cardEl.draggable = false;

  cardEl.innerHTML = `
    <form class="card-form">
      <input type="text" class="card-input title-input" value="${escapeHTML(task.title)}" required maxlength="100">
      <textarea class="card-input desc-input" rows="2" maxlength="500">${escapeHTML(task.description || '')}</textarea>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Save</button>
        <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
      </div>
    </form>
  `;

  const form = cardEl.querySelector('form');
  const titleInput = cardEl.querySelector('.title-input');
  const descInput = cardEl.querySelector('.desc-input');
  const cancelBtn = cardEl.querySelector('.cancel-btn');

  titleInput.focus();

  cancelBtn.onclick = (e) => {
    e.stopPropagation();
    editingTaskId = null;
    renderBoard();
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const newTitle = titleInput.value.trim();
    const newDesc = descInput.value.trim();

    if (!newTitle) {
      showToast('Title is required', 'error');
      return;
    }

    updateTask(taskId, newTitle, newDesc);
    editingTaskId = null;
    renderBoard();
    showToast('Task updated successfully', 'success');
  };

  const outsideClick = (e) => {
    if (!cardEl.contains(e.target)) {
      document.removeEventListener('click', outsideClick);
      if (editingTaskId === taskId) {
        editingTaskId = null;
        renderBoard();
      }
    }
  };

  setTimeout(() => {
    document.addEventListener('click', outsideClick);
  }, 100);
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

document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  renderBoard();
  initDragAndDrop();
  setupListeners();
});
