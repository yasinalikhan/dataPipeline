import { Injectable } from '@angular/core';
import { DiagramNode, DiagramEdge } from '../../shared/models/diagram.model';

const GRID = 20;
const NODE_W = 300;  // width + gap
const NODE_H = 160;  // height + gap
const START_X = 80;
const START_Y = 80;

@Injectable({ providedIn: 'root' })
export class PipelineLayoutService {

  /**
   * Dagre-style BFS auto-layout.
   * Returns a new array of nodes with updated x/y — does NOT mutate originals.
   */
  autoLayout(nodes: DiagramNode[], edges: DiagramEdge[]): DiagramNode[] {
    if (nodes.length === 0) return [];

    // Build adjacency & in-degree maps
    const inDegree = new Map<string, number>();
    const outgoing = new Map<string, string[]>();

    nodes.forEach(n => {
      inDegree.set(n.id, 0);
      outgoing.set(n.id, []);
    });

    edges.forEach(e => {
      const current = inDegree.get(e.targetNodeId) ?? 0;
      inDegree.set(e.targetNodeId, current + 1);
      outgoing.get(e.sourceNodeId)?.push(e.targetNodeId);
    });

    // BFS topological layers
    const layer = new Map<string, number>();
    const queue: string[] = [];

    nodes.forEach(n => {
      if ((inDegree.get(n.id) ?? 0) === 0) {
        queue.push(n.id);
        layer.set(n.id, 0);
      }
    });

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const currentLayer = layer.get(nodeId) ?? 0;
      for (const neighbor of (outgoing.get(nodeId) ?? [])) {
        const neighborLayer = layer.get(neighbor) ?? -1;
        if (neighborLayer <= currentLayer) {
          layer.set(neighbor, currentLayer + 1);
        }
        queue.push(neighbor);
      }
    }

    // Assign any unvisited nodes to their own layer
    nodes.forEach(n => {
      if (!layer.has(n.id)) layer.set(n.id, 0);
    });

    // Group by layer
    const layerGroups = new Map<number, string[]>();
    layer.forEach((l, id) => {
      if (!layerGroups.has(l)) layerGroups.set(l, []);
      layerGroups.get(l)!.push(id);
    });

    // Calculate coordinates
    const updatedPositions = new Map<string, { x: number; y: number }>();
    layerGroups.forEach((ids, layerIdx) => {
      ids.forEach((id, rowIdx) => {
        const rawX = START_X + layerIdx * NODE_W;
        const rawY = START_Y + rowIdx * NODE_H;
        updatedPositions.set(id, {
          x: Math.round(rawX / GRID) * GRID,
          y: Math.round(rawY / GRID) * GRID,
        });
      });
    });

    return nodes.map(n => {
      const pos = updatedPositions.get(n.id);
      return pos ? { ...n, x: pos.x, y: pos.y } : { ...n };
    });
  }

  // ─────────────────────────────────────────────
  // AI Copilot Mock Engine
  // ─────────────────────────────────────────────

  /**
   * Parses a natural language prompt and generates a pipeline graph.
   * Uses keyword heuristics — no external API required.
   */
  generatePipelineFromPrompt(prompt: string): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
    const lower = prompt.toLowerCase();
    const steps = this.parseSteps(lower);

    const nodes: DiagramNode[] = steps.map((step, i) => ({
      id: `ai_node_${Date.now()}_${i}`,
      type: step.type,
      x: 0,
      y: 0,
      data: {
        label: step.label,
        status: 'stopped',
        ...(step.type === 'database' ? { rowsProcessed: 0 } : { latency: 0 }),
      },
    }));

    const edges: DiagramEdge[] = nodes.slice(0, -1).map((n, i) => ({
      id: `ai_edge_${Date.now()}_${i}`,
      sourceNodeId: n.id,
      targetNodeId: nodes[i + 1].id,
    }));

    return { nodes, edges };
  }

  private parseSteps(prompt: string): Array<{ type: string; label: string }> {
    const steps: Array<{ type: string; label: string }> = [];

    // Source patterns
    if (/api|rest|http|fetch|request/.test(prompt))
      steps.push({ type: 'agent', label: 'API Source' });
    else if (/file|csv|excel|parquet|sftp|ftp/.test(prompt))
      steps.push({ type: 'agent', label: 'File Agent' });
    else if (/kafka|queue|message|stream|event/.test(prompt))
      steps.push({ type: 'agent', label: 'Stream Consumer' });
    else if (/snowflake|redshift|postgres|mysql|oracle|bigquery|sql/.test(prompt))
      steps.push({ type: 'database', label: this.extractSource(prompt, 'Source') });
    else
      steps.push({ type: 'agent', label: 'Data Source' });

    // Transform patterns
    if (/transform|process|parse|filter|enrich|clean|mask|pii|validate|map|convert|aggregate/.test(prompt))
      steps.push({ type: 'server', label: 'Data Processor' });

    if (/ml|model|predict|inference|ai|score|classify/.test(prompt))
      steps.push({ type: 'server', label: 'ML Inference Engine' });

    if (/encrypt|decrypt|hash|sign|token/.test(prompt))
      steps.push({ type: 'server', label: 'Security Processor' });

    // Sink patterns
    if (/s3|gcs|azure blob|object storage|bucket/.test(prompt))
      steps.push({ type: 'database', label: 'Object Store Sink' });
    else if (/database|db|warehouse|postgres|mysql|redshift|snowflake/.test(prompt))
      steps.push({ type: 'database', label: this.extractSource(prompt, 'Destination') });
    else if (/kafka|publish|stream|topic/.test(prompt))
      steps.push({ type: 'agent', label: 'Stream Publisher' });
    else if (/email|notify|alert|slack|webhook/.test(prompt))
      steps.push({ type: 'agent', label: 'Notification Agent' });
    else
      steps.push({ type: 'database', label: 'Data Sink' });

    return steps;
  }

  private extractSource(prompt: string, suffix: string): string {
    const patterns = ['snowflake', 'redshift', 'bigquery', 'postgres', 'mysql', 'oracle', 's3'];
    for (const p of patterns) {
      if (prompt.includes(p)) {
        return `${p.charAt(0).toUpperCase() + p.slice(1)} ${suffix}`;
      }
    }
    return `Database ${suffix}`;
  }
}
