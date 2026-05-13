import {
  Component, OnInit, AfterViewInit, ViewChild, HostListener, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { DiagramCanvasComponent } from './components/canvas/diagram-canvas.component';
import { PaletteComponent, PaletteNodeDef } from './components/palette/palette.component';
import { PropertiesPanelComponent, SelectionType, NodeItemData, EdgeItemData } from './components/properties-panel/properties-panel.component';
import { AiCopilotComponent, CopilotGenerateEvent } from './components/ai-copilot/ai-copilot.component';

import { PipelineStateService } from '../../core/services/pipeline-state.service';
import { PipelineLayoutService } from '../../core/services/pipeline-layout.service';
import { DiagramNode } from '../../shared/models/diagram.model';

@Component({
  selector: 'app-designer',
  standalone: true,
  imports: [
    CommonModule,
    DiagramCanvasComponent,
    PaletteComponent,
    PropertiesPanelComponent,
    AiCopilotComponent,
  ],
  styles: [`
    :host {
      display: flex;
      flex: 1;
      height: 100%;
      overflow: hidden;
    }
    .canvas-area {
      flex: 1;
      position: relative;
      overflow: hidden;
    }
  `],
  template: `
    <app-palette
      (addNode)="onAddNode($event)"
    ></app-palette>

    <main class="canvas-area">
      <app-diagram-canvas
        (nodeSelected)="onNodeSelected($event)"
        (edgeSelected)="onEdgeSelected($event)"
        (canvasChanged)="onCanvasChanged()"
      ></app-diagram-canvas>
    </main>

    <app-properties-panel
      [selectionType]="selectionType"
      [nodeData]="selectedNodeData"
      [edgeData]="selectedEdgeData"
      (nodeDataChange)="onItemDataChange($event)"
      (deleteClicked)="onDeleteSelected()"
    ></app-properties-panel>

    <app-ai-copilot
      (generate)="onCopilotGenerate($event)"
    ></app-ai-copilot>
  `,
})
export class DesignerComponent implements OnInit, AfterViewInit {
  @ViewChild(DiagramCanvasComponent) private canvas!: DiagramCanvasComponent;

  private stateService = inject(PipelineStateService);
  private layoutService = inject(PipelineLayoutService);

  selectionType: SelectionType = null;
  selectedNodeData: NodeItemData | null = null;
  selectedEdgeData: EdgeItemData | null = null;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const saved = this.stateService.loadPersistedState();
    if (saved && this.canvas) {
      this.canvas.loadCanvasState(saved);
    }
  }

  // ─── Palette ────────────────────────────────
  onAddNode(item: PaletteNodeDef): void {
    this.canvas?.addNode(item.type, { ...item.defaultData });
  }

  // ─── Canvas events ───────────────────────────
  onNodeSelected(node: DiagramNode | null): void {
    if (node) {
      this.selectionType = 'node';
      this.selectedNodeData = {
        label: node.data?.label ?? '',
        type: node.type,
        status: node.data?.status ?? 'stopped',
        rowsProcessed: node.data?.rowsProcessed,
        latency: node.data?.latency,
      };
      this.selectedEdgeData = null;
    } else if (this.selectionType === 'node') {
      this.selectionType = null;
      this.selectedNodeData = null;
    }
  }

  onEdgeSelected(edge: any | null): void {
    if (edge) {
      this.selectionType = 'edge';
      this.selectedEdgeData = { id: edge.id, source: edge.sourceNodeId, target: edge.targetNodeId };
      this.selectedNodeData = null;
    } else if (this.selectionType === 'edge') {
      this.selectionType = null;
      this.selectedEdgeData = null;
    }
  }

  onCanvasChanged(): void {
    if (this.canvas) {
      this.stateService.pushState(this.canvas.getCanvasState());
    }
  }

  // ─── Properties panel ───────────────────────
  onItemDataChange(newData: NodeItemData): void {
    if (this.canvas && this.selectionType === 'node') {
      const { type, ...dataToSave } = newData;
      this.canvas.updateSelectedNodeData(dataToSave);
      this.selectedNodeData = { ...newData };
    }
  }

  onDeleteSelected(): void {
    this.canvas?.deleteSelected();
    this.selectionType = null;
    this.selectedNodeData = null;
    this.selectedEdgeData = null;
  }

  // ─── Auto-layout ─────────────────────────────
  autoLayout(): void {
    if (!this.canvas) return;
    const state = this.canvas.getCanvasState();
    const laid = this.layoutService.autoLayout(state.nodes, state.edges);
    this.canvas.applyLayout(laid);
  }

  // ─── AI Copilot ──────────────────────────────
  onCopilotGenerate(event: CopilotGenerateEvent): void {
    if (!this.canvas) return;
    const { nodes, edges } = this.layoutService.generatePipelineFromPrompt(event.prompt);

    // Merge into canvas, then layout everything together
    this.canvas.addNodesAndEdges(nodes, edges);

    setTimeout(() => {
      const state = this.canvas.getCanvasState();
      const laid = this.layoutService.autoLayout(state.nodes, state.edges);
      this.canvas.applyLayout(laid);
    }, 50);
  }

  // ─── Undo / Redo ─────────────────────────────
  undo(): void {
    const state = this.stateService.undo();
    if (state && this.canvas) {
      this.stateService.setRestoringFlag(true);
      this.canvas.loadCanvasState(state);
      this.selectionType = null;
      this.selectedNodeData = null;
      this.selectedEdgeData = null;
      setTimeout(() => this.stateService.setRestoringFlag(false), 0);
    }
  }

  redo(): void {
    const state = this.stateService.redo();
    if (state && this.canvas) {
      this.stateService.setRestoringFlag(true);
      this.canvas.loadCanvasState(state);
      this.selectionType = null;
      this.selectedNodeData = null;
      this.selectedEdgeData = null;
      setTimeout(() => this.stateService.setRestoringFlag(false), 0);
    }
  }

  get canUndo(): boolean { return this.stateService.canUndo(); }
  get canRedo(): boolean { return this.stateService.canRedo(); }

  // ─── Keyboard shortcuts ──────────────────────
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    const el = document.activeElement;
    const isInput = el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA');
    if (isInput) return;

    if (event.key === 'Delete' || event.key === 'Backspace') {
      this.onDeleteSelected();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      event.shiftKey ? this.redo() : this.undo();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      this.redo();
    }
  }
}
