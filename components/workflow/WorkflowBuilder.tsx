'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  type Edge,
  type Node,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  cloneGraph,
  loadWorkflows,
  saveWorkflowsToStorage,
  type StoredWorkflow,
} from '@/lib/workflow/workflowStorage';
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

function createStoredWorkflow(
  name: string,
  nodes: Node[],
  edges: Edge[],
): StoredWorkflow {
  const { nodes: n, edges: e } = cloneGraph(nodes, edges);
  return {
    id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    nodes: n,
    edges: e,
    updatedAt: Date.now(),
  };
}

function FitViewOnWorkflowChange({ workflowId }: { workflowId: string | null }) {
  const { fitView } = useReactFlow();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    if (!workflowId || workflowId === prev.current) return;
    prev.current = workflowId;
    const t = requestAnimationFrame(() => {
      fitView({ padding: 0.15, duration: 200 });
    });
    return () => cancelAnimationFrame(t);
  }, [workflowId, fitView]);

  return null;
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

const asideStyle: React.CSSProperties = {
  width: 268,
  flexShrink: 0,
  borderRight: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(12,12,14,0.95)',
  display: 'flex',
  flexDirection: 'column',
  padding: '14px 12px',
  gap: 10,
  overflowY: 'auto',
  minHeight: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.28)',
  padding: '0 8px 2px',
};

type FlowCanvasProps = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: ReturnType<typeof useNodesState>[2];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  activeWorkflowId: string | null;
};

function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  activeWorkflowId,
}: FlowCanvasProps) {
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

  return (
    <WorkflowNodeProvider value={updateNodeData}>
      <div
        className="workflow-canvas workflow-runway"
        style={{ flex: 1, position: 'relative', minHeight: 0, minWidth: 0 }}
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
          <FitViewOnWorkflowChange workflowId={activeWorkflowId} />
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
    </WorkflowNodeProvider>
  );
}

function NodePalette({
  onPaletteDragStart,
}: {
  onPaletteDragStart: (e: React.DragEvent, nodeType: PaletteKey) => void;
}) {
  return (
    <>
      <p style={labelStyle}>Node ekle</p>
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
          marginTop: 4,
          padding: '8px 8px 0',
          fontSize: 11,
          lineHeight: 1.55,
          color: 'rgba(255,255,255,0.28)',
        }}
      >
        Çalıştır: System + Input Prompt → transform → görsel.
      </p>
    </>
  );
}

type StudioProps = {
  workflows: StoredWorkflow[];
  setWorkflows: React.Dispatch<React.SetStateAction<StoredWorkflow[]>>;
  activeId: string | null;
  setActiveId: (id: string) => void;
  nameDraft: string;
  setNameDraft: (s: string) => void;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: ReturnType<typeof useNodesState>[2];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
};

function WorkflowStudio({
  workflows,
  setWorkflows,
  activeId,
  setActiveId,
  nameDraft,
  setNameDraft,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
}: StudioProps) {
  const nameInputRef = useRef<HTMLInputElement>(null);

  const onPaletteDragStart = (e: React.DragEvent, nodeType: PaletteKey) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const selectWorkflow = (w: StoredWorkflow) => {
    setActiveId(w.id);
    setNodes(w.nodes);
    setEdges(w.edges);
    setNameDraft(w.name);
  };

  const handleNew = () => {
    const idx = workflows.length + 1;
    const fresh = createStoredWorkflow(
      `Yeni workflow ${idx}`,
      INITIAL_WORKFLOW_NODES,
      INITIAL_WORKFLOW_EDGES,
    );
    const next = [...workflows, fresh];
    setWorkflows(next);
    saveWorkflowsToStorage(next);
    setActiveId(fresh.id);
    setNodes(fresh.nodes);
    setEdges(fresh.edges);
    setNameDraft(fresh.name);
  };

  const handleSave = () => {
    if (!activeId) return;
    const name = nameDraft.trim() || 'İsimsiz workflow';
    const { nodes: n, edges: e } = cloneGraph(nodes, edges);
    setWorkflows((prev) => {
      const next = prev.map((w) =>
        w.id === activeId
          ? { ...w, name, nodes: n, edges: e, updatedAt: Date.now() }
          : w,
      );
      saveWorkflowsToStorage(next);
      return next;
    });
    setNameDraft(name);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let next = workflows.filter((w) => w.id !== id);
    if (next.length === 0) {
      const fallback = createStoredWorkflow(
        'Varsayılan',
        INITIAL_WORKFLOW_NODES,
        INITIAL_WORKFLOW_EDGES,
      );
      next = [fallback];
    }
    saveWorkflowsToStorage(next);
    setWorkflows(next);
    if (id === activeId) {
      const pick = next[0];
      setActiveId(pick.id);
      setNodes(pick.nodes);
      setEdges(pick.edges);
      setNameDraft(pick.name);
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%' }}>
      <aside style={{ ...asideStyle, width: 240 }}>
        <p style={labelStyle}>Workflow&apos;lar</p>
        <button
          type="button"
          onClick={handleNew}
          style={{
            padding: '9px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,214,10,0.28)',
            background: 'rgba(255,214,10,0.08)',
            color: 'var(--accent)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          + Yeni workflow
        </button>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxHeight: 200,
            overflowY: 'auto',
            paddingRight: 2,
          }}
        >
          {workflows.map((w) => (
            <div
              key={w.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 8,
                border:
                  w.id === activeId
                    ? '1px solid rgba(255,214,10,0.35)'
                    : '1px solid rgba(255,255,255,0.06)',
                background:
                  w.id === activeId
                    ? 'rgba(255,214,10,0.06)'
                    : 'rgba(22,22,26,0.85)',
                padding: '6px 8px',
              }}
            >
              <button
                type="button"
                onClick={() => selectWorkflow(w)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 2px',
                  fontSize: 12,
                  fontWeight: w.id === activeId ? 600 : 500,
                  color: 'rgba(255,255,255,0.88)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={w.name}
              >
                {w.name}
              </button>
              <button
                type="button"
                title="Adı düzenle"
                onClick={(e) => {
                  e.stopPropagation();
                  selectWorkflow(w);
                  requestAnimationFrame(() => nameInputRef.current?.focus());
                }}
                style={{
                  flexShrink: 0,
                  padding: '4px 6px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.45)',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                ✎
              </button>
              <button
                type="button"
                title="Sil"
                onClick={(e) => handleDelete(w.id, e)}
                style={{
                  flexShrink: 0,
                  padding: '4px 7px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'rgba(248,113,113,0.12)',
                  color: 'rgba(248,113,113,0.9)',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {activeId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={labelStyle}>Workflow adı</p>
            <input
              ref={nameInputRef}
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              placeholder="İsim…"
              style={{
                width: '100%',
                padding: '9px 10px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.35)',
                color: 'rgba(255,255,255,0.9)',
                fontSize: 13,
                outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!activeId}
          style={{
            padding: '9px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            background: activeId ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            color: activeId ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
            fontSize: 12,
            fontWeight: 600,
            cursor: activeId ? 'pointer' : 'not-allowed',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Kaydet
        </button>

        <div
          style={{
            height: 1,
            background: 'rgba(255,255,255,0.06)',
            margin: '8px 0',
          }}
        />

        <div className="workflow-palette">
          <NodePalette onPaletteDragStart={onPaletteDragStart} />
        </div>
      </aside>

      <ReactFlowProvider>
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          setNodes={setNodes}
          setEdges={setEdges}
          activeWorkflowId={activeId}
        />
      </ReactFlowProvider>
    </div>
  );
}

export default function WorkflowBuilder() {
  const [mounted, setMounted] = useState(false);
  const [workflows, setWorkflows] = useState<StoredWorkflow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_WORKFLOW_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_WORKFLOW_EDGES);

  useEffect(() => {
    const stored = loadWorkflows();
    if (stored.length === 0) {
      const first = createStoredWorkflow(
        'Varsayılan workflow',
        INITIAL_WORKFLOW_NODES,
        INITIAL_WORKFLOW_EDGES,
      );
      const next = [first];
      saveWorkflowsToStorage(next);
      setWorkflows(next);
      setActiveId(first.id);
      setNodes(first.nodes);
      setEdges(first.edges);
      setNameDraft(first.name);
    } else {
      setWorkflows(stored);
      const first = stored[0];
      setActiveId(first.id);
      setNodes(first.nodes);
      setEdges(first.edges);
      setNameDraft(first.name);
    }
    setMounted(true);
  }, [setNodes, setEdges]);

  if (!mounted) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#08080a',
          color: 'rgba(255,255,255,0.35)',
          fontSize: 13,
        }}
      >
        Yükleniyor…
      </div>
    );
  }

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
          localStorage · Kaydet
        </span>
      </header>

      <WorkflowStudio
        workflows={workflows}
        setWorkflows={setWorkflows}
        activeId={activeId}
        setActiveId={setActiveId}
        nameDraft={nameDraft}
        setNameDraft={setNameDraft}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        setNodes={setNodes}
        setEdges={setEdges}
      />
    </div>
  );
}
