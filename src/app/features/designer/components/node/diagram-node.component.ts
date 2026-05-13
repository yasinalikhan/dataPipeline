import { Component, Input, Output, EventEmitter, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramNode } from '../../../../shared/models/diagram.model';

@Component({
  selector: 'app-diagram-node',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .nifi-node {
      position: absolute;
      width: 280px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-radius: 4px;
      user-select: none;
      display: flex;
      flex-direction: column;
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .nifi-node.selected {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px var(--accent-primary), 0 8px 24px rgba(0, 0, 0, 0.2);
    }
    
    .node-header {
      background: var(--bg-panel);
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color);
      border-radius: 4px 4px 0 0;
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: grab;
    }
    .node-header:active {
      cursor: grabbing;
    }
    
    .node-icon {
      width: 24px;
      height: 24px;
      background: var(--icon-bg);
      color: var(--icon-color);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }
    
    .node-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-main);
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .node-type {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .node-body {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }
    
    .stat-label {
      color: var(--text-secondary);
    }
    
    .stat-value {
      color: var(--text-value);
      font-weight: 500;
    }
    
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #94a3b8;
    }
    .status-running { background: #3b82f6; }
    .status-completed { background: #10b981; }
    .status-failed { background: #ef4444; }
    
    .port {
      position: absolute;
      width: 16px;
      height: 16px;
      background: var(--port-bg);
      border: 2px solid var(--port-border);
      border-radius: 50%;
      cursor: crosshair;
      z-index: 10;
    }
    
    .port:hover {
      transform: scale(1.2);
    }
    
    .port-in {
      top: 50%;
      left: -8px;
      transform: translateY(-50%);
    }
    
    .port-out {
      top: 50%;
      right: -8px;
      transform: translateY(-50%);
    }
  `],
  template: `
    <div 
      class="nifi-node" 
      [attr.data-id]="node.id"
      [class.selected]="selected"
      [style.left.px]="node.x" 
      [style.top.px]="node.y"
      (pointerdown)="onNodePointerDown($event)">
      
      <!-- Input Port -->
      <div 
        class="port port-in" 
        (pointerdown)="onPortPointerDown($event, 'in')">
      </div>

      <div class="node-header" (pointerdown)="onHeaderPointerDown($event)">
        <div class="node-icon">
          <ng-container [ngSwitch]="node.type">
            <svg *ngSwitchCase="'database'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            <svg *ngSwitchCase="'agent'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M15 18a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z"/><path d="M12 15v-6"/><path d="M9 9h6"/><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z"/></svg>
            <svg *ngSwitchCase="'server'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
            <svg *ngSwitchDefault xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
          </ng-container>
        </div>
        <div class="node-title" [title]="node.data?.label || 'Processor'">{{ node.data?.label || 'Processor' }}</div>
        <div class="node-type">{{ node.type }}</div>
      </div>
      
      <div class="node-body">
        <div class="stat-row">
          <span class="stat-label">Status</span>
          <span style="display:flex; align-items:center; gap:6px;">
            <div class="status-indicator" [ngClass]="'status-' + (node.data?.status || 'stopped')"></div>
            <span class="stat-value" style="text-transform: capitalize;">{{ node.data?.status || 'Stopped' }}</span>
          </span>
        </div>
        <div class="stat-row" *ngIf="node.data?.rowsProcessed !== undefined">
          <span class="stat-label">Rows Processed</span>
          <span class="stat-value">{{ node.data?.rowsProcessed | number }}</span>
        </div>
        <div class="stat-row" *ngIf="node.data?.latency !== undefined">
          <span class="stat-label">Latency</span>
          <span class="stat-value">{{ node.data?.latency }} ms</span>
        </div>
      </div>

      <!-- Output Port -->
      <div 
        class="port port-out" 
        (pointerdown)="onPortPointerDown($event, 'out')">
      </div>
    </div>
  `
})
export class DiagramNodeComponent implements OnInit {
  @Input() node!: DiagramNode;
  @Input() selected: boolean = false;
  
  @Output() nodeSelected = new EventEmitter<DiagramNode>();
  @Output() nodeDragStart = new EventEmitter<{event: PointerEvent, node: DiagramNode}>();
  @Output() portDragStart = new EventEmitter<{event: PointerEvent, node: DiagramNode, type: 'in' | 'out'}>();

  constructor(public el: ElementRef) {}

  ngOnInit() {}

  onNodePointerDown(event: PointerEvent) {
    this.nodeSelected.emit(this.node);
  }

  onHeaderPointerDown(event: PointerEvent) {
    // Only drag with left mouse button
    if (event.button !== 0) return;
    
    event.stopPropagation();
    this.nodeSelected.emit(this.node);
    this.nodeDragStart.emit({ event, node: this.node });
  }

  onPortPointerDown(event: PointerEvent, type: 'in' | 'out') {
    if (event.button !== 0) return;
    event.stopPropagation();
    this.portDragStart.emit({ event, node: this.node, type });
  }
}
