export interface DiagramNode {
  id: string;
  type: string;
  x: number;
  y: number;
  data: any;
}

export interface DiagramEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
}

export interface Point {
  x: number;
  y: number;
}
