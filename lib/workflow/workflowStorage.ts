import type { Edge, Node } from 'reactflow';

export const WORKFLOW_STORAGE_KEY = 'klak-studio-workflows-v1';

export type StoredWorkflow = {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  updatedAt: number;
};

export function loadWorkflows(): StoredWorkflow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (w): w is StoredWorkflow =>
        typeof w === 'object' &&
        w !== null &&
        typeof (w as StoredWorkflow).id === 'string' &&
        typeof (w as StoredWorkflow).name === 'string' &&
        Array.isArray((w as StoredWorkflow).nodes) &&
        Array.isArray((w as StoredWorkflow).edges),
    );
  } catch {
    return [];
  }
}

export function saveWorkflowsToStorage(workflows: StoredWorkflow[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(workflows));
  } catch (e) {
    console.error('Workflow save failed:', e);
  }
}

export function cloneGraph(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: JSON.parse(JSON.stringify(nodes)) as Node[],
    edges: JSON.parse(JSON.stringify(edges)) as Edge[],
  };
}
