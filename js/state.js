/**
 * Central State Management for Kanban Task Board
 * Implements a Pub/Sub store pattern to decouple data updates from the UI rendering.
 */

const STORAGE_KEY = 'kanban_board_state_v1';

// Default initial state
const DEFAULT_STATE = {
  todo: [],
  inprogress: [],
  done: []
};

class StateStore {
  constructor() {
    this.state = this._loadFromStorage();
    this.listeners = [];
  }

  /**
   * Loads board state from localStorage. Handles parsing errors and corrupted state validation.
   */
  _loadFromStorage() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        return JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
      
      const parsed = JSON.parse(serialized);
      
      // Basic validation of schema to prevent app breaks
      const isValid = parsed && 
                      Array.isArray(parsed.todo) && 
                      Array.isArray(parsed.inprogress) && 
                      Array.isArray(parsed.done);

      if (!isValid) {
        console.warn('Invalid board data scheme detected in storage. Resetting to default.');
        return JSON.parse(JSON.stringify(DEFAULT_STATE));
      }

      return parsed;
    } catch (error) {
      this._emitError('Failed to read saved tasks. Local storage might be blocked or corrupted.', error);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  /**
   * Persists the current state in localStorage. Handles quota limits and storage disable exceptions.
   */
  _saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this._emitError('Local storage is full. Unable to save your latest changes.', error);
      } else {
        this._emitError('Failed to save changes to storage. Please check permissions.', error);
      }
      return false;
    }
  }

  /**
   * Emits a state error event for user-friendly toast updates.
   */
  _emitError(userMessage, systemError) {
    console.error('StateStore Error:', userMessage, systemError);
    // Dispatch a custom event that app.js can listen to for rendering Toast alerts
    const event = new CustomEvent('board-error', { detail: { message: userMessage } });
    window.dispatchEvent(event);
  }

  /**
   * Subscribes a listener function that gets called whenever state changes.
   */
  subscribe(listener) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notifies all registered listeners of a state update.
   */
  _notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (err) {
        console.error('Error notifying subscriber:', err);
      }
    });
  }

  /**
   * Returns a deep clone of the current state to preserve state integrity.
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Validates task fields to ensure robustness.
   */
  _validateTaskInput(title, description) {
    if (!title || typeof title !== 'string' || title.trim() === '') {
      throw new Error('Task title cannot be empty.');
    }
    if (title.length > 100) {
      throw new Error('Task title must be under 100 characters.');
    }
    if (description && description.length > 500) {
      throw new Error('Task description must be under 500 characters.');
    }
  }

  /**
   * Adds a new card to a specific column.
   */
  addCard(columnId, title, description = '') {
    try {
      this._validateTaskInput(title, description);

      if (!this.state[columnId]) {
        throw new Error(`Target column "${columnId}" does not exist.`);
      }

      const newCard = {
        id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: title.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString()
      };

      this.state[columnId].push(newCard);
      this._saveToStorage();
      this._notify();
      return newCard;
    } catch (error) {
      this._emitError(error.message, error);
      throw error;
    }
  }

  /**
   * Updates an existing card's details.
   */
  updateCard(cardId, updatedFields) {
    try {
      if (updatedFields.title !== undefined || updatedFields.description !== undefined) {
        this._validateTaskInput(updatedFields.title ?? 'Valid Title', updatedFields.description ?? '');
      }

      let found = false;

      // Find and update inside columns
      for (const colId in this.state) {
        const index = this.state[colId].findIndex(card => card.id === cardId);
        if (index !== -1) {
          this.state[colId][index] = {
            ...this.state[colId][index],
            ...updatedFields,
            // Don't allow changing IDs
            id: cardId 
          };
          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error('Task card could not be found.');
      }

      this._saveToStorage();
      this._notify();
    } catch (error) {
      this._emitError(error.message, error);
      throw error;
    }
  }

  /**
   * Deletes a card from the board.
   */
  deleteCard(cardId) {
    try {
      let found = false;

      for (const colId in this.state) {
        const originalLength = this.state[colId].length;
        this.state[colId] = this.state[colId].filter(card => card.id !== cardId);
        if (this.state[colId].length !== originalLength) {
          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error('Task card could not be found to delete.');
      }

      this._saveToStorage();
      this._notify();
    } catch (error) {
      this._emitError(error.message, error);
      throw error;
    }
  }

  /**
   * Moves a card within a column or between columns.
   */
  moveCard(cardId, sourceColId, targetColId, targetIndex) {
    try {
      if (!this.state[sourceColId] || !this.state[targetColId]) {
        throw new Error('Source or target column does not exist.');
      }

      // Find the card in the source column
      const sourceCol = this.state[sourceColId];
      const cardIndex = sourceCol.findIndex(card => card.id === cardId);

      if (cardIndex === -1) {
        throw new Error('Card could not be found in the source column.');
      }

      // Extract card
      const [cardToMove] = sourceCol.splice(cardIndex, 1);

      // Insert at target column index
      const targetCol = this.state[targetColId];
      
      // Boundary safety for inserting index
      const insertIndex = Math.max(0, Math.min(targetIndex, targetCol.length));
      targetCol.splice(insertIndex, 0, cardToMove);

      this._saveToStorage();
      this._notify();
    } catch (error) {
      this._emitError(error.message, error);
      throw error;
    }
  }

  /**
   * Clears all tasks from the board.
   */
  clearAll() {
    try {
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      this._saveToStorage();
      this._notify();
    } catch (error) {
      this._emitError('Failed to reset board. State could not be cleared.', error);
    }
  }
}

// Export a single instance to be used across components (Singleton design pattern)
export const store = new StateStore();
export default store;
