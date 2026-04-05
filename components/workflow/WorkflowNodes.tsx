'use client';

import { Handle, Position, type NodeProps } from 'reactflow';

const shell: React.CSSProperties = {
  padding: '12px 14px',
  minWidth: 168,
  borderRadius: 12,
  border: '1px solid var(--border-default)',
  background: 'var(--bg-elevated)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
  fontFamily: "'DM Sans', sans-serif",
};

const title: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-secondary)',
  marginBottom: 4,
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--text-primary)',
};

const handleBase: React.CSSProperties = {
  width: 10,
  height: 10,
  border: '2px solid var(--bg-void)',
  background: 'var(--accent)',
};

function NodeChrome({
  children,
  accent,
  selected,
}: {
  children: React.ReactNode;
  accent: string;
  selected: boolean;
}) {
  return (
    <div
      style={{
        ...shell,
        borderColor: selected ? accent : 'var(--border-default)',
        boxShadow: selected
          ? `0 0 0 1px ${accent}, 0 12px 32px rgba(0,0,0,0.45)`
          : shell.boxShadow as string,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ ...handleBase, left: -5 }}
      />
      {children}
      <Handle
        type="source"
        position={Position.Right}
        style={{ ...handleBase, right: -5 }}
      />
    </div>
  );
}

export function TextPromptNode({ data, selected }: NodeProps<{ label: string }>) {
  return (
    <NodeChrome accent="#7dd3fc" selected={!!selected}>
      <div style={title}>Text Prompt</div>
      <div style={labelStyle}>{data.label}</div>
    </NodeChrome>
  );
}

export function ImageGenerateNode({ data, selected }: NodeProps<{ label: string }>) {
  return (
    <NodeChrome accent="#c4b5fd" selected={!!selected}>
      <div style={title}>Image Generate</div>
      <div style={labelStyle}>{data.label}</div>
    </NodeChrome>
  );
}

export function VideoGenerateNode({ data, selected }: NodeProps<{ label: string }>) {
  return (
    <NodeChrome accent="#f9a8d4" selected={!!selected}>
      <div style={title}>Video Generate</div>
      <div style={labelStyle}>{data.label}</div>
    </NodeChrome>
  );
}

export function ExportNode({ data, selected }: NodeProps<{ label: string }>) {
  return (
    <NodeChrome accent="#86efac" selected={!!selected}>
      <div style={title}>Export</div>
      <div style={labelStyle}>{data.label}</div>
    </NodeChrome>
  );
}
