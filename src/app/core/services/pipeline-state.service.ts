import { Injectable, signal, computed } from '@angular/core';

export interface CanvasState {
  nodes: any[];
  edges: any[];
  panX: number;
  panY: number;
  zoom: number;
}

const STORAGE_KEY = 'pipeline-state';
const MAX_HISTORY = 50;

@Injectable({ providedIn: 'root' })
export class PipelineStateService {
  private history: CanvasState[] = [];
  private historyIndex = signal(-1);

  readonly canUndo = computed(() => this.historyIndex() > 0);
  readonly canRedo = computed(() => this.historyIndex() < this.history.length - 1);

  private isRestoring = false;

  /** Call after every user action on the canvas */
  pushState(state: CanvasState): void {
    if (this.isRestoring) return;

    const stateStr = JSON.stringify(state);
    const idx = this.historyIndex();
    if (idx >= 0 && JSON.stringify(this.history[idx]) === stateStr) {
      return; // No actual change — skip
    }

    // Truncate redo branch
    if (idx < this.history.length - 1) {
      this.history = this.history.slice(0, idx + 1);
    }

    const copy = JSON.parse(stateStr) as CanvasState;
    this.history.push(copy);

    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    } else {
      this.historyIndex.set(this.historyIndex() + 1);
    }

    this.persist(copy);
  }

  undo(): CanvasState | null {
    if (!this.canUndo()) return null;
    this.historyIndex.set(this.historyIndex() - 1);
    return this.currentSnapshot();
  }

  redo(): CanvasState | null {
    if (!this.canRedo()) return null;
    this.historyIndex.set(this.historyIndex() + 1);
    return this.currentSnapshot();
  }

  /** Load initial state from localStorage */
  loadPersistedState(): CanvasState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const state = JSON.parse(raw) as CanvasState;
      this.isRestoring = true;
      this.history = [state];
      this.historyIndex.set(0);
      this.isRestoring = false;
      return state;
    } catch {
      return null;
    }
  }

  clearState(): void {
    this.history = [];
    this.historyIndex.set(-1);
    localStorage.removeItem(STORAGE_KEY);
  }

  setRestoringFlag(value: boolean): void {
    this.isRestoring = value;
  }

  private currentSnapshot(): CanvasState {
    return JSON.parse(JSON.stringify(this.history[this.historyIndex()]));
  }

  private persist(state: CanvasState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
