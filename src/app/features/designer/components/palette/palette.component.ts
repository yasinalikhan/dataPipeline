import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PaletteNodeDef {
  type: string;
  label: string;
  defaultData: any;
}

const PALETTE_ITEMS: PaletteNodeDef[] = [
  {
    type: 'agent',
    label: 'File Agent',
    defaultData: { label: 'File Agent', status: 'completed', latency: 15 },
  },
  {
    type: 'server',
    label: 'Processing Server',
    defaultData: { label: 'Processing Server', status: 'running', latency: 250 },
  },
  {
    type: 'database',
    label: 'Database',
    defaultData: { label: 'Data Warehouse', status: 'running', rowsProcessed: 14502 },
  },
];

@Component({
  selector: 'app-palette',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 250px;
      background: var(--bg-panel);
      border-right: 1px solid var(--header-border);
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
      cursor: grab;
      transition: all 0.2s;
      user-select: none;
    }
    .palette-item:active { cursor: grabbing; }
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
  `],
  template: `
    <div class="sidebar-header">Components</div>
    <div class="palette">
      <div
        *ngFor="let item of items"
        class="palette-item"
        draggable="true"
        (click)="onItemClick(item)"
        (dragstart)="onDragStart($event, item)"
      >
        <div class="palette-icon">
          <svg *ngIf="item.type === 'agent'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M15 18a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z"/><path d="M12 15v-6"/><path d="M9 9h6"/><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z"/></svg>
          <svg *ngIf="item.type === 'server'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
          <svg *ngIf="item.type === 'database'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        </div>
        <span class="palette-label">{{ item.label }}</span>
      </div>
    </div>
  `,
})
export class PaletteComponent {
  @Output() addNode = new EventEmitter<PaletteNodeDef>();
  @Output() dragStart = new EventEmitter<{ event: DragEvent; item: PaletteNodeDef }>();

  readonly items = PALETTE_ITEMS;

  onItemClick(item: PaletteNodeDef): void {
    this.addNode.emit(item);
  }

  onDragStart(event: DragEvent, item: PaletteNodeDef): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify({ type: item.type, data: item.defaultData }));
      event.dataTransfer.effectAllowed = 'copy';
    }
    this.dragStart.emit({ event, item });
  }
}
