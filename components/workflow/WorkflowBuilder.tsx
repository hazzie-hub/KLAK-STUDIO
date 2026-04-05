'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
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
import {
  TextPromptNode,
  ImageGenerateNode,
  VideoGenerateNode,
  ExportNode,
} from './WorkflowNodes';

const nodeTypes: NodeTypes = {
  textPrompt: TextPromptNode,
  imageGenerate: ImageGenerateNode,
  videoGenerate: VideoGenerateNode,
  exportNode: ExportNode,
};

type PaletteKey = keyof typeof PALETTE_META;

const PALETTE_META = {
  textPrompt: { title: 'Text Prompt', hint: 'Metin girdisi', accent: '#7dd3fc' },
  imageGenerate: { title: 'Image Generate', hint: 'Görsel üret', accent: '#c4b5fd' },
  videoGenerate: { title: 'Video Generate', hint: 'Video üret', accent: '#f9a8d4' },
  exportNode: { title: 'Export', hint: 'Dışa aktar', accent: '#86efac' },
} as const;

const DEFAULT_LABELS: Record<PaletteKey, string> = {
  textPrompt: 'Prompt metni…',
  imageGenerate: 'Model / ayar',
  videoGenerate: 'Süre / çözünürlük',
  exportNode: 'PNG / MP4',
};

function makeNode(type: PaletteKey, position: { x: number; y: number }): Node {
  const id = `wf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    type,
    position,
    data: { label: DEFAULT_LABELS[type] },
  };
}

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: 'var(--accent)', strokeWidth: 1.5 },
          },
          eds,
        ),
      ),
    [setEdges],
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
    <div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%' }}>
      {/* Palette */}
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          borderRight: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
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
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
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
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-elevated)',
                cursor: 'grab',
                transition: 'border-color 0.15s ease, transform 0.15s ease',
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
                    color: 'var(--text-primary)',
                  }}
                >
                  {meta.title}
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
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
            lineHeight: 1.5,
            color: 'var(--text-muted)',
          }}
        >
          Kutuyu tuval üzerine sürükleyin. Çıkış noktasından girişe bağlayın.
        </p>
      </aside>

      {/* Canvas */}
      <div className="workflow-canvas" style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: 'rgba(255, 214, 10, 0.65)', strokeWidth: 1.5 },
          }}
          style={{ background: 'var(--bg-void)' }}
        >
          <Background color="rgba(255,255,255,0.03)" gap={20} size={1} />
          <Controls
            className="workflow-controls"
            showInteractive={false}
          />
          <MiniMap
            nodeStrokeWidth={2}
            zoomable
            pannable
            maskColor="rgba(8,8,8,0.85)"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
            }}
            nodeColor={(n) => {
              const t = n.type;
              if (t === 'textPrompt') return '#7dd3fc';
              if (t === 'imageGenerate') return '#c4b5fd';
              if (t === 'videoGenerate') return '#f9a8d4';
              if (t === 'exportNode') return '#86efac';
              return '#FFD60A';
            }}
          />
        </ReactFlow>
      </div>
    </div>
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
        background: 'var(--bg-void)',
      }}
    >
      <header
        style={{
          height: 52,
          flexShrink: 0,
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 16,
          background: 'var(--bg-surface)',
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span aria-hidden>←</span> Studio
        </Link>
        <span style={{ color: 'var(--border-default)', fontSize: 12 }}>|</span>
        <span
          className="font-display"
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}
        >
          Workflow Builder
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          React Flow · Sürükle &amp; bağla
        </span>
      </header>

      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </div>
  );
}
