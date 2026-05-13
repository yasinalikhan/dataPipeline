import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PipelineStateService } from './core/services/pipeline-state.service';
import { DesignerComponent } from './features/designer/designer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DesignerComponent],
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
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: white;
    }
    .brand-name {
      font-size: 18px; font-weight: 700;
      background: linear-gradient(90deg, var(--accent-hover), var(--border-hover));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .actions { display: flex; gap: 8px; align-items: center; }
    .btn {
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: background 0.15s, opacity 0.15s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-ghost {
      background: var(--btn-ghost-bg);
      color: var(--text-value);
    }
    .btn-ghost:hover { background: var(--btn-ghost-hover); }
    .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-primary {
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      color: white;
    }
    .btn-primary:hover { opacity: 0.9; }
    .divider { width: 1px; height: 24px; background: var(--header-border); margin: 0 2px; }
    .workspace { display: flex; flex: 1; height: calc(100vh - 60px); overflow: hidden; }
  `],
  template: `
    <header>
      <div class="brand">
        <div class="brand-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        </div>
        <span class="brand-name">Pipeline Designer AI</span>
      </div>

      <div class="actions">
        <!-- Undo / Redo -->
        <button class="btn btn-ghost" (click)="designer?.undo()" [disabled]="!designer?.canUndo" title="Undo (Ctrl+Z)">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          Undo
        </button>
        <button class="btn btn-ghost" (click)="designer?.redo()" [disabled]="!designer?.canRedo" title="Redo (Ctrl+Y)">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
          Redo
        </button>

        <div class="divider"></div>

        <!-- Auto-layout -->
        <button class="btn btn-primary" (click)="designer?.autoLayout()" title="Auto-organize layout">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Organize
        </button>

        <div class="divider"></div>

        <!-- File operations -->
        <input type="file" #fileInput (change)="onFileSelected($event)" accept=".json" style="display: none;">
        <button class="btn btn-ghost" (click)="onClearAll()" title="Clear canvas">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Clear
        </button>
        <button class="btn btn-ghost" (click)="fileInput.click()" title="Import pipeline JSON">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Import
        </button>
        <button class="btn btn-ghost" (click)="onExport()" title="Export pipeline JSON">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export
        </button>

        <div class="divider"></div>

        <!-- Theme toggle -->
        <button class="btn btn-ghost" (click)="toggleTheme()" title="Toggle theme">
          <svg *ngIf="isDarkTheme" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg *ngIf="!isDarkTheme" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          Theme
        </button>
      </div>
    </header>

    <div class="workspace">
      <app-designer #designer></app-designer>
    </div>
  `,
})
export class AppComponent implements OnInit {
  @ViewChild('designer') designer!: DesignerComponent;
  @ViewChild('fileInput') fileInput!: ElementRef;

  private stateService = inject(PipelineStateService);

  isDarkTheme = true;

  ngOnInit(): void {
    const saved = localStorage.getItem('theme-preference');
    if (saved) this.isDarkTheme = saved === 'dark';
    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme-preference', this.isDarkTheme ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.isDarkTheme ? 'dark' : 'light');
  }

  onClearAll(): void {
    if (confirm('Clear the canvas? All progress will be lost.')) {
      this.designer?.['canvas']?.clearCanvas();
      this.stateService.clearState();
    }
  }

  onExport(): void {
    const canvas = this.designer?.['canvas'];
    if (!canvas) return;
    const state = canvas.getCanvasState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pipeline-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const state = JSON.parse(e.target.result);
        const canvas = this.designer?.['canvas'];
        if (canvas) {
          canvas.loadCanvasState(state);
          this.stateService.pushState(state);
        }
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }
}
