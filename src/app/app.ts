import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
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
          <div class="palette-item" (click)="onAddNode('agent', { label: 'File Agent', status: 'completed', latency: 15 })">
            <div class="palette-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M15 18a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z"/><path d="M12 15v-6"/><path d="M9 9h6"/><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z"/></svg>
            </div>
            <span class="palette-label">File Agent</span>
          </div>

          <div class="palette-item" (click)="onAddNode('server', { label: 'Processing Server', status: 'running', latency: 250 })">
            <div class="palette-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
            </div>
            <span class="palette-label">Processing Server</span>
          </div>

          <div class="palette-item" (click)="onAddNode('database', { label: 'Data Warehouse', status: 'running', rowsProcessed: 14502 })">
            <div class="palette-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            </div>
            <span class="palette-label">Database</span>
          </div>
        </div>
      </aside>

      <!-- Main Canvas -->
      <main class="canvas-area">
        <app-diagram-canvas (nodeSelected)="onNodeSelected($event)" (edgeSelected)="onEdgeSelected($event)"></app-diagram-canvas>
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
export class App implements OnInit {
  @ViewChild(DiagramCanvasComponent) diagramCanvas!: DiagramCanvasComponent;

  isDarkTheme = true;
  selectionType: 'node' | 'edge' | null = null;
  selectedItemData: any = null;

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme-preference');
    if (savedTheme) {
      this.isDarkTheme = savedTheme === 'dark';
    }
    this.applyTheme();
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
    if (event.key === 'Delete' || event.key === 'Backspace') {
      // Prevent deleting if user is typing in an input field
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      this.onDeleteSelected();
    }
  }

  onDeleteSelected() {
    if (this.diagramCanvas) {
      this.diagramCanvas.deleteSelected();
    }
  }
}
