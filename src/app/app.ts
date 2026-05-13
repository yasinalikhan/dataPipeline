import { Component, OnInit, ViewChild, HostListener, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiagramCanvasComponent } from './diagram-canvas.component';
import { DiagramNode } from './diagram.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, DiagramCanvasComponent],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 100vw;
      height: 100vh;
      background: var(--bg-base);
      color: var(--text-main);
      font-family: 'Inter', sans-serif;
      overflow: hidden;
    }
    header {
      height: 60px;
      min-height: 60px;
      background: var(--bg-panel);
      border-bottom: 1px solid var(--header-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      flex-shrink: 0;
      z-index: 10;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: white;
    }
    .brand-name {
      font-size: 18px;
      font-weight: 700;
      background: linear-gradient(90deg, var(--accent-hover), var(--border-hover));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .actions { display: flex; gap: 10px; }
    .btn {
      padding: 7px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: background 0.15s;
      display: flex;
      align-items: center;
    }
    .btn-ghost {
      background: var(--btn-ghost-bg);
      color: var(--text-value);
    }
    .btn-ghost:hover { background: var(--btn-ghost-hover); }
    
    .workspace {
      display: flex;
      flex: 1;
      height: calc(100vh - 60px);
      overflow: hidden;
    }
    .sidebar-left {
      width: 250px;
      background: var(--bg-panel);
      border-right: 1px solid var(--header-border);
      display: flex;
      flex-direction: column;
      z-index: 5;
    }
    .sidebar-header {
      padding: 16px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--header-border);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .palette {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
    }
    .palette-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--icon-bg);
      border: 1px solid var(--header-border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .palette-item:hover {
      border-color: var(--accent-primary);
      background: var(--palette-hover-bg);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px var(--palette-hover-shadow);
    }
    .palette-icon {
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      color: var(--border-hover);
    }
    .palette-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-main);
    }
    
    .canvas-area {
      flex: 1;
      position: relative;
      overflow: hidden;
    }
    
    .sidebar-right {
      width: 300px;
      background: var(--bg-panel);
      border-left: 1px solid var(--header-border);
      display: flex;
      flex-direction: column;
      z-index: 5;
    }
    .properties-panel {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow-y: auto;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .form-group label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
    }
    .form-control {
      background: var(--form-input-bg);
      border: 1px solid var(--header-border);
      color: var(--text-main);
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      transition: border-color 0.15s;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--accent-primary);
    }
    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: var(--text-muted);
      font-size: 14px;
    }
  `],
  template: `
    <header>
      <div class="brand">
        <div class="brand-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        </div>
        <span class="brand-name">Custom Pipeline Designer</span>
      </div>

      <div class="actions">
        <button class="btn btn-ghost" (click)="undo()" [disabled]="historyIndex <= 0" [style.opacity]="historyIndex <= 0 ? 0.5 : 1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>
          Undo
        </button>
        <button class="btn btn-ghost" (click)="redo()" [disabled]="historyIndex >= history.length - 1" [style.opacity]="historyIndex >= history.length - 1 ? 0.5 : 1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path></svg>
          Redo
        </button>
        <div style="width: 1px; height: 24px; background: var(--header-border); margin: 0 4px;"></div>

        <input type="file" #fileInput (change)="onFileSelected($event)" accept=".json" style="display: none;">
        
        <button class="btn btn-ghost" (click)="onClearAll()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          Clear
        </button>

        <button class="btn btn-ghost" (click)="onImport()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Import
        </button>

        <button class="btn btn-ghost" (click)="onExport()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export
        </button>

        <button class="btn btn-ghost" (click)="toggleTheme()">
          <svg *ngIf="isDarkTheme" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg *ngIf="!isDarkTheme" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          Theme
        </button>
      </div>
    </header>

    <div class="workspace">
      <!-- Palette Sidebar -->
      <aside class="sidebar-left">
        <div class="sidebar-header">Components</div>
        <div class="palette">
          <div class="palette-item" 
               (click)="onAddNode('agent', { label: 'File Agent', status: 'completed', latency: 15 })"
               draggable="true"
               (dragstart)="onDragStart($event, 'agent', { label: 'File Agent', status: 'completed', latency: 15 })">
            <div class="palette-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M15 18a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z"/><path d="M12 15v-6"/><path d="M9 9h6"/><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z"/></svg>
            </div>
            <span class="palette-label">File Agent</span>
          </div>

          <div class="palette-item" 
               (click)="onAddNode('server', { label: 'Processing Server', status: 'running', latency: 250 })"
               draggable="true"
               (dragstart)="onDragStart($event, 'server', { label: 'Processing Server', status: 'running', latency: 250 })">
            <div class="palette-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
            </div>
            <span class="palette-label">Processing Server</span>
          </div>

          <div class="palette-item" 
               (click)="onAddNode('database', { label: 'Data Warehouse', status: 'running', rowsProcessed: 14502 })"
               draggable="true"
               (dragstart)="onDragStart($event, 'database', { label: 'Data Warehouse', status: 'running', rowsProcessed: 14502 })">
            <div class="palette-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            </div>
            <span class="palette-label">Database</span>
          </div>
        </div>
      </aside>

      <!-- Main Canvas -->
      <main class="canvas-area">
        <app-diagram-canvas (nodeSelected)="onNodeSelected($event)" (edgeSelected)="onEdgeSelected($event)" (canvasChanged)="onCanvasChanged()"></app-diagram-canvas>
      </main>

      <!-- Properties Sidebar -->
      <aside class="sidebar-right">
        <div class="sidebar-header">Configuration</div>
        
        <div class="empty-state" *ngIf="!selectionType">
          Select a component or connection on the canvas to view and edit its properties.
        </div>

        <div class="properties-panel" *ngIf="selectionType === 'node' && selectedItemData">
          <div class="form-group">
            <label>Name</label>
            <input type="text" class="form-control" [(ngModel)]="selectedItemData.label" (ngModelChange)="onItemDataChange()">
          </div>
          
          <div class="form-group">
            <label>Component Type</label>
            <input type="text" class="form-control" [value]="selectedItemData.type" disabled style="opacity: 0.7;">
          </div>
          
          <div class="form-group">
            <label>Execution Status</label>
            <select class="form-control" [(ngModel)]="selectedItemData.status" (ngModelChange)="onItemDataChange()">
              <option value="stopped">Stopped</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div class="form-group" *ngIf="selectedItemData.rowsProcessed !== undefined">
            <label>Rows Processed</label>
            <input type="number" class="form-control" [(ngModel)]="selectedItemData.rowsProcessed" (ngModelChange)="onItemDataChange()">
          </div>

          <div class="form-group" *ngIf="selectedItemData.latency !== undefined">
            <label>Latency (ms)</label>
            <input type="number" class="form-control" [(ngModel)]="selectedItemData.latency" (ngModelChange)="onItemDataChange()">
          </div>

          <div class="form-group" style="margin-top: auto; padding-top: 20px;">
            <button class="btn btn-ghost" style="color: #ef4444; border: 1px solid #ef4444; justify-content: center; width: 100%;" (click)="onDeleteSelected()">
              Delete Component
            </button>
          </div>
        </div>

        <div class="properties-panel" *ngIf="selectionType === 'edge' && selectedItemData">
          <div class="form-group">
            <label>Connection ID</label>
            <input type="text" class="form-control" [value]="selectedItemData.id" disabled style="opacity: 0.7;">
          </div>
          
          <div class="form-group" style="margin-top: auto; padding-top: 20px;">
            <button class="btn btn-ghost" style="color: #ef4444; border: 1px solid #ef4444; justify-content: center; width: 100%;" (click)="onDeleteSelected()">
              Delete Connection
            </button>
          </div>
        </div>
      </aside>
    </div>
  `
})
export class App implements OnInit, AfterViewInit {
  @ViewChild(DiagramCanvasComponent) diagramCanvas!: DiagramCanvasComponent;
  @ViewChild('fileInput') fileInput!: ElementRef;

  isDarkTheme = true;
  selectionType: 'node' | 'edge' | null = null;
  selectedItemData: any = null;

  history: any[] = [];
  historyIndex: number = -1;
  isUndoRedoAction = false;

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme-preference');
    if (savedTheme) {
      this.isDarkTheme = savedTheme === 'dark';
    }
    this.applyTheme();
  }

  ngAfterViewInit() {
    // Load state after view init so canvas component is available
    const savedState = localStorage.getItem('pipeline-state');
    if (savedState && this.diagramCanvas) {
      try {
        const state = JSON.parse(savedState);
        this.diagramCanvas.loadCanvasState(state);
        this.pushHistory(state);
      } catch(e) {
        console.error('Failed to load state', e);
        this.pushHistory(this.diagramCanvas.getCanvasState());
      }
    } else if (this.diagramCanvas) {
      this.pushHistory(this.diagramCanvas.getCanvasState());
    }
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme-preference', this.isDarkTheme ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme() {
    if (this.isDarkTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  onAddNode(type: string, defaultData: any) {
    if (this.diagramCanvas) {
      this.diagramCanvas.addNode(type, { ...defaultData });
    }
  }

  onDragStart(event: DragEvent, type: string, defaultData: any) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify({ type, data: defaultData }));
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  onNodeSelected(node: DiagramNode | null) {
    if (node) {
      this.selectionType = 'node';
      this.selectedItemData = { ...node.data, type: node.type };
    } else if (this.selectionType === 'node') {
      this.selectionType = null;
      this.selectedItemData = null;
    }
  }

  onEdgeSelected(edge: any | null) {
    if (edge) {
      this.selectionType = 'edge';
      this.selectedItemData = { id: edge.id, source: edge.sourceNodeId, target: edge.targetNodeId };
    } else if (this.selectionType === 'edge') {
      this.selectionType = null;
      this.selectedItemData = null;
    }
  }

  onItemDataChange() {
    if (this.diagramCanvas && this.selectionType === 'node' && this.selectedItemData) {
      // Remove type before passing data back
      const { type, ...dataToSave } = this.selectedItemData;
      this.diagramCanvas.updateSelectedNodeData(dataToSave);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    const activeEl = document.activeElement;
    const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA');
      
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!isInput) {
        this.onDeleteSelected();
      }
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      if (!isInput) {
        event.preventDefault();
        if (event.shiftKey) {
          this.redo();
        } else {
          this.undo();
        }
      }
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      if (!isInput) {
        event.preventDefault();
        this.redo();
      }
    }
  }

  onDeleteSelected() {
    if (this.diagramCanvas) {
      this.diagramCanvas.deleteSelected();
    }
  }

  onCanvasChanged() {
    if (this.diagramCanvas) {
      const state = this.diagramCanvas.getCanvasState();
      localStorage.setItem('pipeline-state', JSON.stringify(state));
      if (!this.isUndoRedoAction) {
        const stateStr = JSON.stringify(state);
        if (this.historyIndex >= 0 && this.historyIndex < this.history.length) {
          if (JSON.stringify(this.history[this.historyIndex]) === stateStr) {
            return; // State hasn't actually changed, ignore
          }
        }
        this.pushHistory(state);
      }
    }
  }

  pushHistory(state: any) {
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    const stateCopy = JSON.parse(JSON.stringify(state));
    this.history.push(stateCopy);
    if (this.history.length > 50) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreState();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreState();
    }
  }

  restoreState() {
    if (this.diagramCanvas && this.history[this.historyIndex]) {
      this.isUndoRedoAction = true;
      const stateCopy = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.diagramCanvas.loadCanvasState(stateCopy);
      localStorage.setItem('pipeline-state', JSON.stringify(stateCopy));
      
      this.selectionType = null;
      this.selectedItemData = null;
      
      setTimeout(() => {
        this.isUndoRedoAction = false;
      }, 0);
    }
  }

  onClearAll() {
    if (confirm('Are you sure you want to clear the canvas? All progress will be lost.')) {
      if (this.diagramCanvas) {
        this.diagramCanvas.clearCanvas();
        localStorage.removeItem('pipeline-state');
      }
    }
  }

  onExport() {
    if (this.diagramCanvas) {
      const state = this.diagramCanvas.getCanvasState();
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pipeline-export.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  onImport() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const state = JSON.parse(e.target.result);
          if (this.diagramCanvas) {
            this.diagramCanvas.loadCanvasState(state);
            this.onCanvasChanged(); // save newly imported state to local storage
          }
        } catch (error) {
          alert('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    }
    // reset input
    event.target.value = '';
  }
}
