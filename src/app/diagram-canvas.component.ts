import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, HostListener, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramNodeComponent } from './diagram-node.component';
import { DiagramNode, DiagramEdge, Point } from './diagram.models';

@Component({
  selector: 'app-diagram-canvas',
  standalone: true,
  imports: [CommonModule, DiagramNodeComponent],
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      background-color: var(--bg-base);
      background-image: radial-gradient(circle, var(--canvas-dots) 1px, transparent 1px);
    }
    
    .canvas-container {
      width: 100%;
      height: 100%;
      position: relative;
      transform-origin: 0 0;
      cursor: grab;
    }
    .canvas-container:active {
      cursor: grabbing;
    }
    
    .canvas-content {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
    }
    
    svg.edges-overlay {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      overflow: visible;
    }
    
    .edge-path {
      fill: none;
      stroke: var(--edge-stroke);
      stroke-width: 3px;
      stroke-linecap: round;
      pointer-events: stroke;
      transition: stroke 0.2s;
    }
    .edge-path:hover {
      stroke: var(--edge-stroke-hover);
    }
    .edge-path.selected {
      stroke: var(--accent-primary);
      filter: drop-shadow(0 0 4px var(--accent-primary));
    }
    .edge-path.draft {
      stroke-dasharray: 5, 5;
      stroke: var(--accent-primary);
      opacity: 0.6;
    }
  `],
  template: `
    <div 
      class="canvas-container" 
      #container
      [style.transform]="'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoom + ')'"
      (pointerdown)="onCanvasPointerDown($event)"
      (wheel)="onCanvasWheel($event)">
      
      <div class="canvas-content" #content>
        <!-- Edges -->
        <svg class="edges-overlay">
          <!-- Render saved edges -->
          <path 
            *ngFor="let edge of edges" 
            class="edge-path" 
            [class.selected]="edge.id === selectedEdgeId"
            [attr.d]="getEdgePath(edge)"
            (pointerdown)="onEdgePointerDown($event, edge)">
          </path>
          
          <!-- Render draft edge -->
          <path 
            *ngIf="draftEdge" 
            class="edge-path draft" 
            [attr.d]="getDraftEdgePath()">
          </path>
        </svg>

        <!-- Nodes -->
        <app-diagram-node
          *ngFor="let node of nodes"
          [node]="node"
          [selected]="node.id === selectedNodeId"
          (nodeSelected)="onNodeSelected($event)"
          (nodeDragStart)="onNodeDragStart($event)"
          (portDragStart)="onPortDragStart($event)">
        </app-diagram-node>
      </div>
    </div>
  `
})
export class DiagramCanvasComponent implements AfterViewInit {
  @ViewChild('container') containerRef!: ElementRef;
  @ViewChild('content') contentRef!: ElementRef;

  @Output() nodeSelected = new EventEmitter<DiagramNode | null>();
  @Output() edgeSelected = new EventEmitter<DiagramEdge | null>();

  @HostBinding('style.background-position') get bgPos() {
    return `${this.panX}px ${this.panY}px`;
  }
  @HostBinding('style.background-size') get bgSize() {
    return `${28 * this.zoom}px ${28 * this.zoom}px`;
  }

  nodes: DiagramNode[] = [];
  edges: DiagramEdge[] = [];
  selectedNodeId: string | null = null;
  selectedEdgeId: string | null = null;

  // Viewport state
  panX = 0;
  panY = 0;
  zoom = 1;

  // Dragging state
  isDraggingCanvas = false;
  lastPointerPos = { x: 0, y: 0 };
  
  draggingNode: DiagramNode | null = null;
  
  // Connection state
  draftEdge: { sourceNodeId: string, currentPos: Point } | null = null;

  ngAfterViewInit() {
    // Initial centering logic could go here if needed
  }

  // API for parent
  addNode(type: string, data: any) {
    const newNode: DiagramNode = {
      id: 'node_' + Math.random().toString(36).substr(2, 9),
      type,
      x: -this.panX / this.zoom + 100 + Math.random() * 50,
      y: -this.panY / this.zoom + 100 + Math.random() * 50,
      data
    };
    this.nodes.push(newNode);
    this.selectNode(newNode);
  }

  updateSelectedNodeData(data: any) {
    if (this.selectedNodeId) {
      const node = this.nodes.find(n => n.id === this.selectedNodeId);
      if (node) {
        node.data = { ...data };
      }
    }
  }

  selectNode(node: DiagramNode | null) {
    this.selectedNodeId = node ? node.id : null;
    this.selectedEdgeId = null;
    this.nodeSelected.emit(node);
    if (node) this.edgeSelected.emit(null);
  }

  selectEdge(edge: DiagramEdge | null) {
    this.selectedEdgeId = edge ? edge.id : null;
    this.selectedNodeId = null;
    this.edgeSelected.emit(edge);
    if (edge) this.nodeSelected.emit(null);
  }

  deleteSelected() {
    if (this.selectedNodeId) {
      this.nodes = this.nodes.filter(n => n.id !== this.selectedNodeId);
      this.edges = this.edges.filter(e => e.sourceNodeId !== this.selectedNodeId && e.targetNodeId !== this.selectedNodeId);
      this.selectNode(null);
    } else if (this.selectedEdgeId) {
      this.edges = this.edges.filter(e => e.id !== this.selectedEdgeId);
      this.selectEdge(null);
    }
  }

  // Canvas Interactions
  onCanvasPointerDown(event: PointerEvent) {
    if (event.button !== 0) return; // Only left click
    
    // If clicking directly on container (not a node), start panning
    if ((event.target as HTMLElement).classList.contains('canvas-container') || (event.target as HTMLElement).classList.contains('canvas-content') || (event.target as HTMLElement).tagName.toLowerCase() === 'svg') {
      this.isDraggingCanvas = true;
      this.lastPointerPos = { x: event.clientX, y: event.clientY };
      this.selectNode(null); // Deselect
      this.selectEdge(null);
      
      (event.target as Element)?.setPointerCapture(event.pointerId);
    }
  }

  onCanvasWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -event.deltaY * zoomSensitivity;
    
    const newZoom = Math.min(Math.max(0.2, this.zoom + delta), 3);
    
    // Zoom toward pointer
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    this.panX -= x * (newZoom - this.zoom) / this.zoom;
    this.panY -= y * (newZoom - this.zoom) / this.zoom;
    this.zoom = newZoom;
  }

  // Node & Port Interactions
  onNodeSelected(node: DiagramNode) {
    this.selectNode(node);
  }

  onEdgePointerDown(event: PointerEvent, edge: DiagramEdge) {
    if (event.button !== 0) return;
    event.stopPropagation();
    this.selectEdge(edge);
  }

  onNodeDragStart(data: {event: PointerEvent, node: DiagramNode}) {
    this.draggingNode = data.node;
    this.lastPointerPos = { x: data.event.clientX, y: data.event.clientY };
    (data.event.target as Element)?.setPointerCapture(data.event.pointerId);
  }

  onPortDragStart(data: {event: PointerEvent, node: DiagramNode, type: 'in' | 'out'}) {
    if (data.type === 'out') {
      this.draftEdge = {
        sourceNodeId: data.node.id,
        currentPos: this.clientToCanvas(data.event.clientX, data.event.clientY)
      };
      (data.event.target as Element)?.setPointerCapture(data.event.pointerId);
    } else {
       // In NiFi you drag from OUT to IN
    }
  }

  // Global Pointer Events
  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent) {
    if (this.isDraggingCanvas) {
      const dx = event.clientX - this.lastPointerPos.x;
      const dy = event.clientY - this.lastPointerPos.y;
      this.panX += dx;
      this.panY += dy;
      this.lastPointerPos = { x: event.clientX, y: event.clientY };
    } 
    else if (this.draggingNode) {
      const dx = (event.clientX - this.lastPointerPos.x) / this.zoom;
      const dy = (event.clientY - this.lastPointerPos.y) / this.zoom;
      this.draggingNode.x += dx;
      this.draggingNode.y += dy;
      this.lastPointerPos = { x: event.clientX, y: event.clientY };
    }
    else if (this.draftEdge) {
      this.draftEdge.currentPos = this.clientToCanvas(event.clientX, event.clientY);
    }
  }

  @HostListener('pointerup', ['$event'])
  onPointerUp(event: PointerEvent) {
    if (this.isDraggingCanvas) {
      this.isDraggingCanvas = false;
      (event.target as Element)?.releasePointerCapture(event.pointerId);
    }
    if (this.draggingNode) {
      this.draggingNode = null;
      (event.target as Element)?.releasePointerCapture(event.pointerId);
    }
    if (this.draftEdge) {
      // Check if dropped on an input port
      const targetElement = document.elementFromPoint(event.clientX, event.clientY);
      if (targetElement && targetElement.classList.contains('port-in')) {
        // Find the node this port belongs to.
        // It's inside .nifi-node, but we need the node ID. Let's just find the component.
        // For simplicity, we can search all nodes to see which one contains this element, 
        // or just rely on a custom attribute.
        // Let's attach data-node-id to the port in the node component! Wait, I didn't.
        // Let's do it by finding the parent .nifi-node and checking its index.
        const nodeEl = targetElement.closest('.nifi-node') as HTMLElement;
        if (nodeEl) {
          // hacky way: match position or add data attr.
          // Let's add data-id to the nifi-node in diagram-node.component.ts.
          // Wait, I can't easily without modifying it. I will modify diagram-node to add id.
          // For now, assume it's added.
          const targetId = nodeEl.getAttribute('data-id');
          if (targetId && targetId !== this.draftEdge.sourceNodeId) {
            this.edges.push({
              id: 'edge_' + Math.random().toString(36).substr(2, 9),
              sourceNodeId: this.draftEdge.sourceNodeId,
              targetNodeId: targetId
            });
          }
        }
      }
      this.draftEdge = null;
      (event.target as Element)?.releasePointerCapture(event.pointerId);
    }
  }

  // Edge drawing logic
  getEdgePath(edge: DiagramEdge): string {
    const srcNode = this.nodes.find(n => n.id === edge.sourceNodeId);
    const tgtNode = this.nodes.find(n => n.id === edge.targetNodeId);
    if (!srcNode || !tgtNode) return '';

    // Port positions: OUT is on right, IN is on left.
    // Node width is 280, port is centered vertically.
    // We assume node height is approx 120px for center.
    // Let's measure exactly? We can estimate or use a ref.
    const srcX = srcNode.x + 280;
    const srcY = srcNode.y + 60; // Approx middle
    const tgtX = tgtNode.x;
    const tgtY = tgtNode.y + 60;

    return this.createBezier(srcX, srcY, tgtX, tgtY);
  }

  getDraftEdgePath(): string {
    if (!this.draftEdge) return '';
    const srcNode = this.nodes.find(n => n.id === this.draftEdge!.sourceNodeId);
    if (!srcNode) return '';
    
    const srcX = srcNode.x + 280;
    const srcY = srcNode.y + 60;
    const tgtX = this.draftEdge.currentPos.x;
    const tgtY = this.draftEdge.currentPos.y;
    
    return this.createBezier(srcX, srcY, tgtX, tgtY);
  }

  private createBezier(x1: number, y1: number, x2: number, y2: number): string {
    const dx = Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  }

  private clientToCanvas(clientX: number, clientY: number): Point {
    const rect = this.contentRef.nativeElement.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / this.zoom,
      y: (clientY - rect.top) / this.zoom
    };
  }
}
