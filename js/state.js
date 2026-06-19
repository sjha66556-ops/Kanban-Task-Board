export let boardData = {
  todo: [],
  inprogress: [],
  done: []
};

export function loadTasks() {
  try {
    const data = localStorage.getItem('kanban_board_state_v1');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.todo) && Array.isArray(parsed.inprogress) && Array.isArray(parsed.done)) {
        boardData.todo = parsed.todo;
        boardData.inprogress = parsed.inprogress;
        boardData.done = parsed.done;
      }
    }
  } catch (e) {
    console.error('Could not load tasks', e);
  }
}

export function saveTasks() {
  try {
    localStorage.setItem('kanban_board_state_v1', JSON.stringify(boardData));
  } catch (e) {
    console.error('Could not save tasks', e);
  }
}

export function addTask(columnId, title, desc = '') {
  const newTask = {
    id: 'task-' + Date.now(),
    title: title.trim(),
    description: desc.trim(),
    createdAt: new Date().toISOString()
  };
  boardData[columnId].push(newTask);
  saveTasks();
  return newTask;
}

export function updateTask(taskId, newTitle, newDesc) {
  for (let col in boardData) {
    const task = boardData[col].find(t => t.id === taskId);
    if (task) {
      task.title = newTitle.trim();
      task.description = newDesc.trim();
      saveTasks();
      return;
    }
  }
}

export function deleteTask(taskId) {
  for (let col in boardData) {
    boardData[col] = boardData[col].filter(t => t.id !== taskId);
  }
  saveTasks();
}

export function moveTask(taskId, fromCol, toCol, toIndex) {
  const taskList = boardData[fromCol];
  const idx = taskList.findIndex(t => t.id === taskId);
  if (idx === -1) return;

  const [task] = taskList.splice(idx, 1);

  if (toIndex === undefined || toIndex === null) {
    boardData[toCol].push(task);
  } else {
    boardData[toCol].splice(toIndex, 0, task);
  }

  saveTasks();
}

export function clearAllTasks() {
  boardData.todo = [];
  boardData.inprogress = [];
  boardData.done = [];
  saveTasks();
}
