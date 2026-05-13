import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type SelectionType = 'node' | 'edge' | null;

export interface NodeItemData {
  label: string;
  type: string;
  status: string;
  rowsProcessed?: number;
  latency?: number;
}

export interface EdgeItemData {
  id: string;
  source: string;
  target: string;
}

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 300px;
      background: var(--bg-panel);
      border-left: 1px solid var(--header-border);
      z-index: 5;
      flex-shrink: 0;
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
    .properties-panel {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow-y: auto;
      flex: 1;
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
    .form-control:disabled { opacity: 0.6; cursor: not-allowed; }
    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.6;
    }
    .btn-danger {
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid #ef4444;
      background: transparent;
      color: #ef4444;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      transition: background 0.15s;
    }
    .btn-danger:hover { background: rgba(239,68,68,0.1); }
  `],
  template: `
    <div class="sidebar-header">Configuration</div>

    <div class="empty-state" *ngIf="!selectionType">
      Select a component or connection on the canvas to view and edit its properties.
    </div>

    <!-- Node properties -->
    <div class="properties-panel" *ngIf="selectionType === 'node' && nodeData">
      <div class="form-group">
        <label>Name</label>
        <input type="text" class="form-control" [(ngModel)]="nodeData.label" (ngModelChange)="onDataChange()">
      </div>
      <div class="form-group">
        <label>Component Type</label>
        <input type="text" class="form-control" [value]="nodeData.type" disabled>
      </div>
      <div class="form-group">
        <label>Execution Status</label>
        <select class="form-control" [(ngModel)]="nodeData.status" (ngModelChange)="onDataChange()">
          <option value="stopped">Stopped</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <div class="form-group" *ngIf="nodeData.rowsProcessed !== undefined">
        <label>Rows Processed</label>
        <input type="number" class="form-control" [(ngModel)]="nodeData.rowsProcessed" (ngModelChange)="onDataChange()">
      </div>
      <div class="form-group" *ngIf="nodeData.latency !== undefined">
        <label>Latency (ms)</label>
        <input type="number" class="form-control" [(ngModel)]="nodeData.latency" (ngModelChange)="onDataChange()">
      </div>
      <div class="form-group" style="margin-top: auto; padding-top: 20px;">
        <button class="btn-danger" (click)="deleteClicked.emit()">Delete Component</button>
      </div>
    </div>

    <!-- Edge properties -->
    <div class="properties-panel" *ngIf="selectionType === 'edge' && edgeData">
      <div class="form-group">
        <label>Connection ID</label>
        <input type="text" class="form-control" [value]="edgeData.id" disabled>
      </div>
      <div class="form-group">
        <label>Source Node</label>
        <input type="text" class="form-control" [value]="edgeData.source" disabled>
      </div>
      <div class="form-group">
        <label>Target Node</label>
        <input type="text" class="form-control" [value]="edgeData.target" disabled>
      </div>
      <div class="form-group" style="margin-top: auto; padding-top: 20px;">
        <button class="btn-danger" (click)="deleteClicked.emit()">Delete Connection</button>
      </div>
    </div>
  `,
})
export class PropertiesPanelComponent {
  @Input() selectionType: SelectionType = null;
  @Input() nodeData: NodeItemData | null = null;
  @Input() edgeData: EdgeItemData | null = null;

  @Output() nodeDataChange = new EventEmitter<NodeItemData>();
  @Output() deleteClicked = new EventEmitter<void>();

  onDataChange(): void {
    if (this.nodeData) this.nodeDataChange.emit({ ...this.nodeData });
  }
}
