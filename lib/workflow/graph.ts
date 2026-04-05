import type { Edge, Node } from 'reactflow';

export type WorkflowNodeType =
  | 'systemPrompt'
  | 'inputPrompt'
  | 'inputImage'
  | 'aiProcess'
  | 'imageOutput';

export function getSourceNode(
  edges: Edge[],
  nodes: Node[],
  targetId: string,
  targetHandle: string | null,
): Node | undefined {
  const edge = edges.find(
    (e) => e.target === targetId && e.targetHandle === targetHandle,
  );
  if (!edge) return undefined;
  return nodes.find((n) => n.id === edge.source);
}

export function getTextFromNode(node: Node | undefined): string {
  if (!node?.data || typeof node.data !== 'object') return '';
  const d = node.data as { text?: string };
  return typeof d.text === 'string' ? d.text : '';
}

export function getImageFromNode(node: Node | undefined): string | null {
  if (!node?.data || typeof node.data !== 'object') return null;
  const d = node.data as { imageBase64?: string | null };
  if (typeof d.imageBase64 === 'string' && d.imageBase64.startsWith('data:')) {
    return d.imageBase64;
  }
  return null;
}
