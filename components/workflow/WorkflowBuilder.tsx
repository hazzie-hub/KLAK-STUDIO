'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Node,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { runWorkflowPipeline } from '@/lib/workflow/runPipeline';
import { WorkflowNodeProvider } from './WorkflowContext';
import {
  AIProcessNode,
  ImageOutputNode,
  InputImageNode,
  InputPromptNode,
  SystemPromptNode,
} from './WorkflowNodes';
import { INITIAL_WORKFLOW_EDGES, INITIAL_WORKFLOW_NODES } from './workflowInitial';

const nodeTypes: NodeTypes = {
  systemPrompt: SystemPromptNode,
  inputPrompt: InputPromptNode,
  inputImage: InputImageNode,
  aiProcess: AIProcessNode,
  imageOutput: ImageOutputNode,
};

type PaletteKey =
  | 'systemPrompt'
  | 'inputPrompt'
  | 'inputImage'
  | 'aiProcess'
  | 'imageOutput';

const PALETTE_META: Record<
  PaletteKey,
  { title: string; hint: string; accent: string }
> = {
  systemPrompt: {
    title: 'System Prompt',
    hint: 'Yönerge / sistem mesajı',
    accent: '#3DDC84',
  },
  inputPrompt: {
    title: 'Input Prompt',
    hint: 'Kullanıcı metni',
    accent: '#3DDC84',
  },
  inputImage: {
    title: 'Input Image',
    hint: 'Referans görsel',
    accent: '#5B8CFF',
  },
  aiProcess: {
    title: 'AI Process',
    hint: 'Prompt + görsel birleştirme',
    accent: '#FFD60A',
  },
  imageOutput: {
    title: 'Image Output',
    hint: 'Üretilen görseller',
    accent: '#60a5fa',
  },
};

function defaultData(type: PaletteKey): Record<string, unknown> {
  switch (type) {
    case 'systemPrompt':
      return { text: '' };
    case 'inputPrompt':
      return { text: 'Yeni sahne…' };
    case 'inputImage':
      return { imageBase64: null };
    case 'aiProcess':
      return { outputText: '', runPhase: 'idle' };
    case 'imageOutput':
      return {
        images: [],
        aspectRatio: '16:9',
        runPhase: 'idle',
      };
    default:
      return {};
  }
}

function makeNode(type: PaletteKey, position: { x: number; y: number }): Node {
  const id = `wf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    type,
    position,
    data: defaultData(type),
  };
}

function RunPipelinePanel({
  setNodes,
}: {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
}) {
  const { getNodes, getEdges } = useReactFlow();
  const [busy, setBusy] = useState(false);

  const handleRun = async () => {
    const nodes = getNodes();
    const edges = getEdges();
    setBusy(true);
    setNodes((nds) =>
      nds.map((n) => {
        if (n.type === 'aiProcess') {
          return {
            ...n,
            data: {
              ...n.data,
              runPhase: 'running',
              errorMessage: undefined,
            },
          };
        }
        if (n.type === 'imageOutput') {
          return {
            ...n,
            data: {
              ...n.data,
              runPhase: 'running',
              errorMessage: undefined,
              images: [],
            },
          };
        }
        return n;
      }),
    );

    const result = await runWorkflowPipeline(nodes, edges);

    setNodes((nds) =>
      nds.map((n) => {
        if (n.type === 'aiProcess') {
          if (!result.ok) {
            return {
              ...n,
              data: {
                ...n.data,
                runPhase: 'error',
                errorMessage: result.error,
                outputText: result.transformedPrompt ?? '',
              },
            };
          }
          return {
            ...n,
            data: {
              ...n.data,
              runPhase: 'done',
              outputText: result.transformedPrompt ?? '',
              errorMessage: undefined,
            },
          };
        }
        if (n.type === 'imageOutput') {
          if (!result.ok) {
            return {
              ...n,
              data: {
                ...n.data,
                runPhase: 'error',
                errorMessage: result.error ?? 'Hata',
                images: [],
              },
            };
          }
          return {
            ...n,
            data: {
              ...n.data,
              runPhase: 'done',
              images: result.images ?? [],
              errorMessage: undefined,
            },
          };
        }
        return n;
      }),
    );
    setBusy(false);
  };

  return (
    <Panel position="top-right" style={{ margin: 12 }}>
      <button
        type="button"
        onClick={handleRun}
        disabled={busy}
        style={{
          padding: '10px 20px',
          borderRadius: 10,
          border: '1px solid rgba(255,214,10,0.35)',
          background: busy
            ? 'rgba(255,214,10,0.08)'
            : 'rgba(255,214,10,0.14)',
          color: 'var(--accent)',
          fontSize: 13,
          fontWeight: 600,
          cursor: busy ? 'wait' : 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {busy ? 'Çalışıyor…' : 'Çalıştır'}
      </button>
    </Panel>
  );
}

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_WORKFLOW_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_WORKFLOW_EDGES);
  const { screenToFlowPosition, getNode } = useReactFlow();

  const updateNodeData = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
        ),
      );
    },
    [setNodes],
  );

  const isValidConnection = useCallback(
    (connection: Connection) => {
      const { source, target, sourceHandle, targetHandle } = connection;
      if (!source || !target || !targetHandle) return false;
      const s = getNode(source)?.type;
      const t = getNode(target)?.type;
      if (t === 'aiProcess') {
        if (targetHandle === 'system') {
          return s === 'systemPrompt' && sourceHandle === 'out';
        }
        if (targetHandle === 'prompt') {
          return s === 'inputPrompt' && sourceHandle === 'out';
        }
        if (targetHandle === 'image') {
          return s === 'inputImage' && sourceHandle === 'out';
        }
        return false;
      }
      if (t === 'imageOutput') {
        if (targetHandle === 'fromAi') {
          return s === 'aiProcess' && sourceHandle === 'out';
        }
        if (targetHandle === 'ref') {
          return s === 'inputImage' && sourceHandle === 'out';
        }
        return false;
      }
      return false;
    },
    [getNode],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const sourceNode = getNode(params.source);
      const stroke =
        sourceNode?.type === 'inputImage' ? '#5B8CFF' : '#3DDC84';
      setEdges((eds) => {
        const filtered = eds.filter(
          (e) =>
            !(
              e.target === params.target &&
              e.targetHandle === params.targetHandle
            ),
        );
        return addEdge(
          {
            ...params,
            animated: true,
            style: { stroke, strokeWidth: 2 },
          },
          filtered,
        );
      });
    },
    [getNode, setEdges],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/reactflow');
      if (!raw || !(raw in PALETTE_META)) return;
      const type = raw as PaletteKey;
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      setNodes((nds) => nds.concat(makeNode(type, position)));
    },
    [screenToFlowPosition, setNodes],
  );

  const onPaletteDragStart = (e: React.DragEvent, nodeType: PaletteKey) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <WorkflowNodeProvider value={updateNodeData}>
      <div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%' }}>
        <aside
          className="workflow-palette"
          style={{
            width: 228,
            flexShrink: 0,
            borderRight: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(12,12,14,0.95)',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 12px',
            gap: 10,
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.28)',
              padding: '0 8px 4px',
            }}
          >
            Node ekle
          </p>
          {(Object.keys(PALETTE_META) as PaletteKey[]).map((key) => {
            const meta = PALETTE_META[key];
            return (
              <div
                key={key}
                draggable
                onDragStart={(e) => onPaletteDragStart(e, key)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(22,22,26,0.9)',
                  cursor: 'grab',
                }}
                onMouseDown={(e) => {
                  (e.currentTarget as HTMLDivElement).style.cursor = 'grabbing';
                }}
                onMouseUp={(e) => {
                  (e.currentTarget as HTMLDivElement).style.cursor = 'grab';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: meta.accent,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.9)',
                    }}
                  >
                    {meta.title}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>
                  {meta.hint}
                </span>
              </div>
            );
          })}
          <p
            style={{
              marginTop: 'auto',
              padding: '12px 8px 0',
              fontSize: 11,
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.28)',
            }}
          >
            Çalıştır: System + Input Prompt metinleri → transform → görsel üretimi.
          </p>
        </aside>

        <div
          className="workflow-canvas workflow-runway"
          style={{ flex: 1, position: 'relative', minHeight: 0 }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.2}
            maxZoom={1.5}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
            }}
            connectionLineStyle={{ stroke: '#3DDC84', strokeWidth: 2 }}
            style={{ background: '#0a0a0c' }}
          >
            <RunPipelinePanel setNodes={setNodes} />
            <Background
              gap={22}
              size={1.15}
              color="rgba(255,255,255,0.045)"
            />
            <Controls
              className="workflow-controls"
              showInteractive={false}
            />
            <MiniMap
              nodeStrokeWidth={2}
              zoomable
              pannable
              maskColor="rgba(6,6,8,0.92)"
              style={{
                background: 'rgba(18,18,22,0.95)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
              }}
              nodeColor={(n) => {
                const t = n.type;
                if (t === 'inputImage') return '#5B8CFF';
                if (t === 'imageOutput') return '#60a5fa';
                if (t === 'aiProcess') return '#FFD60A';
                return '#3DDC84';
              }}
            />
          </ReactFlow>
        </div>
      </div>
    </WorkflowNodeProvider>
  );
}

export default function WorkflowBuilder() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#08080a',
      }}
    >
      <header
        style={{
          height: 52,
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 16,
          background: 'rgba(14,14,16,0.98)',
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span aria-hidden>←</span> Studio
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 12 }}>|</span>
        <span
          className="font-display"
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'rgba(255,255,255,0.92)',
          }}
        >
          Workflow
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
          Transform + Generate · Çalıştır
        </span>
      </header>

      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </div>
  );
}
