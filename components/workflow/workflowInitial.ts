import type { Edge, Node } from 'reactflow';
import { DEFAULT_INPUT_PROMPT, DEFAULT_SYSTEM_PROMPT } from './defaults';

export const INITIAL_WORKFLOW_NODES: Node[] = [
  {
    id: 'node-system',
    type: 'systemPrompt',
    position: { x: 24, y: 32 },
    data: { text: DEFAULT_SYSTEM_PROMPT },
  },
  {
    id: 'node-input',
    type: 'inputPrompt',
    position: { x: 24, y: 340 },
    data: { text: DEFAULT_INPUT_PROMPT },
  },
  {
    id: 'node-image',
    type: 'inputImage',
    position: { x: 24, y: 520 },
    data: { imageBase64: null as string | null },
  },
  {
    id: 'node-ai',
    type: 'aiProcess',
    position: { x: 460, y: 220 },
    data: {
      outputText: '',
      runPhase: 'idle' as const,
    },
  },
  {
    id: 'node-out',
    type: 'imageOutput',
    position: { x: 940, y: 260 },
    data: {
      images: [] as { url: string; revisedPrompt?: string }[],
      aspectRatio: '16:9' as const,
      runPhase: 'idle' as const,
    },
  },
];

export const INITIAL_WORKFLOW_EDGES: Edge[] = [
  {
    id: 'e-sys',
    source: 'node-system',
    target: 'node-ai',
    sourceHandle: 'out',
    targetHandle: 'system',
    animated: true,
    style: { stroke: '#3DDC84', strokeWidth: 2 },
  },
  {
    id: 'e-in',
    source: 'node-input',
    target: 'node-ai',
    sourceHandle: 'out',
    targetHandle: 'prompt',
    animated: true,
    style: { stroke: '#3DDC84', strokeWidth: 2 },
  },
  {
    id: 'e-img-ai',
    source: 'node-image',
    target: 'node-ai',
    sourceHandle: 'out',
    targetHandle: 'image',
    animated: true,
    style: { stroke: '#5B8CFF', strokeWidth: 2 },
  },
  {
    id: 'e-ai-out',
    source: 'node-ai',
    target: 'node-out',
    sourceHandle: 'out',
    targetHandle: 'fromAi',
    animated: true,
    style: { stroke: '#3DDC84', strokeWidth: 2 },
  },
  {
    id: 'e-img-ref',
    source: 'node-image',
    target: 'node-out',
    sourceHandle: 'out',
    targetHandle: 'ref',
    animated: true,
    style: { stroke: '#5B8CFF', strokeWidth: 2 },
  },
];
