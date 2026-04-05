'use client';

import { Handle, Position, useEdges, useNodes, type NodeProps } from 'reactflow';
import type { AspectRatio } from '@/types';
import { getImageFromNode, getSourceNode } from '@/lib/workflow/graph';
import { useUpdateNodeData } from './WorkflowContext';

const card: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(22,22,24,0.92)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  minWidth: 300,
  maxWidth: 380,
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  gap: 8,
};

const headerTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.02em',
  color: 'rgba(255,255,255,0.88)',
};

const menuDots: React.CSSProperties = {
  color: 'rgba(255,255,255,0.28)',
  fontSize: 16,
  lineHeight: 1,
  letterSpacing: 2,
  userSelect: 'none',
};

const bodyPad: React.CSSProperties = {
  padding: '10px 12px 12px',
};

const textArea: React.CSSProperties = {
  width: '100%',
  minHeight: 120,
  resize: 'vertical' as const,
  padding: '10px 11px',
  fontSize: 12.5,
  lineHeight: 1.55,
  color: 'rgba(255,255,255,0.88)',
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8,
  outline: 'none',
  fontFamily: 'inherit',
};

function SourceHandle({
  id,
  variant,
}: {
  id: string;
  variant: 'green' | 'blue';
}) {
  return (
    <Handle
      type="source"
      position={Position.Right}
      id={id}
      className={variant === 'blue' ? 'wf-handle wf-h-source wf-h-blue' : 'wf-handle wf-h-source wf-h-green'}
      style={{ right: -6 }}
    />
  );
}

function TargetHandle({
  id,
  variant,
  top,
}: {
  id: string;
  variant: 'green' | 'blue';
  top: string;
}) {
  return (
    <Handle
      type="target"
      position={Position.Left}
      id={id}
      className={variant === 'blue' ? 'wf-handle wf-h-target wf-h-blue' : 'wf-handle wf-h-target wf-h-green'}
      style={{ left: -6, top }}
    />
  );
}

export function SystemPromptNode({
  id,
  data,
  selected,
}: NodeProps<{ text: string }>) {
  const updateNodeData = useUpdateNodeData();

  return (
    <div
      style={{
        ...card,
        outline: selected ? '1px solid rgba(61,220,132,0.55)' : undefined,
      }}
    >
      <div style={headerRow}>
        <span style={headerTitle}>System Prompt</span>
        <span style={menuDots}>···</span>
      </div>
      <div style={bodyPad}>
        <textarea
          value={data.text ?? ''}
          onChange={(e) => updateNodeData(id, { text: e.target.value })}
          style={{ ...textArea, minHeight: 140 }}
          spellCheck={false}
        />
      </div>
      <SourceHandle id="out" variant="green" />
    </div>
  );
}

export function InputPromptNode({
  id,
  data,
  selected,
}: NodeProps<{ text: string }>) {
  const updateNodeData = useUpdateNodeData();

  return (
    <div
      style={{
        ...card,
        outline: selected ? '1px solid rgba(61,220,132,0.55)' : undefined,
      }}
    >
      <div style={headerRow}>
        <span style={headerTitle}>Input Prompt</span>
        <span style={menuDots}>···</span>
      </div>
      <div style={bodyPad}>
        <textarea
          value={data.text ?? ''}
          onChange={(e) => updateNodeData(id, { text: e.target.value })}
          style={{ ...textArea, minHeight: 72 }}
          spellCheck={false}
        />
      </div>
      <SourceHandle id="out" variant="green" />
    </div>
  );
}

export function InputImageNode({
  id,
  data,
  selected,
}: NodeProps<{ imageBase64: string | null; fileName?: string }>) {
  const updateNodeData = useUpdateNodeData();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateNodeData(id, {
        imageBase64: reader.result as string,
        fileName: f.name,
      });
    };
    reader.readAsDataURL(f);
  };

  return (
    <div
      style={{
        ...card,
        minWidth: 320,
        outline: selected ? '1px solid rgba(91,140,255,0.55)' : undefined,
      }}
    >
      <div style={headerRow}>
        <span style={headerTitle}>Input Image</span>
        <span style={menuDots}>···</span>
      </div>
      <div style={bodyPad}>
        <label
          style={{
            display: 'block',
            cursor: 'pointer',
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px dashed rgba(255,255,255,0.12)',
            background: 'rgba(0,0,0,0.25)',
            minHeight: 140,
            position: 'relative',
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={onFile}
            style={{ display: 'none' }}
          />
          {data.imageBase64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.imageBase64}
              alt=""
              style={{
                width: '100%',
                maxHeight: 200,
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                padding: 36,
                textAlign: 'center',
                fontSize: 12,
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              Görsel seç (tıkla)
            </div>
          )}
        </label>
        {data.fileName && (
          <p
            style={{
              marginTop: 8,
              fontSize: 10,
              color: 'rgba(255,255,255,0.35)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {data.fileName}
          </p>
        )}
      </div>
      <SourceHandle id="out" variant="blue" />
    </div>
  );
}

type AIProcessData = {
  outputText: string;
  runPhase: 'idle' | 'running' | 'done' | 'error';
  errorMessage?: string;
};

export function AIProcessNode({ data, selected }: NodeProps<AIProcessData>) {
  const busy = data.runPhase === 'running';

  return (
    <div
      style={{
        ...card,
        minWidth: 320,
        outline: selected ? '1px solid rgba(255,214,10,0.45)' : undefined,
      }}
    >
      <TargetHandle id="system" variant="green" top="18%" />
      <TargetHandle id="prompt" variant="green" top="48%" />
      <TargetHandle id="image" variant="blue" top="78%" />

      <div style={headerRow}>
        <span style={{ ...headerTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 2,
              background: 'linear-gradient(135deg,#f97316,#ef4444)',
            }}
          />
          AI Process
        </span>
        <span style={menuDots}>···</span>
      </div>
      <div style={bodyPad}>
        <textarea
          readOnly
          value={
            busy
              ? 'İşleniyor…'
              : data.errorMessage
                ? data.errorMessage
                : data.outputText ?? ''
          }
          style={{
            ...textArea,
            minHeight: 160,
            opacity: busy ? 0.65 : 1,
            color: data.errorMessage ? 'rgba(248,113,113,0.95)' : undefined,
          }}
        />
        {busy && (
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              color: 'rgba(255,214,10,0.85)',
            }}
          >
            <span
              className="wf-spin"
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                border: '2px solid rgba(255,214,10,0.4)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
              }}
            />
            Prompt dönüştürülüyor ve görseller üretiliyor
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="wf-handle wf-h-source wf-h-green"
        style={{ right: -6, top: '48%' }}
      />
    </div>
  );
}

type ImageOutData = {
  images: { url: string; revisedPrompt?: string }[];
  aspectRatio: AspectRatio;
  runPhase: 'idle' | 'running' | 'done' | 'error';
  errorMessage?: string;
};

const aspects: AspectRatio[] = ['16:9', '9:16', '1:1', '4:3', '3:4'];

export function ImageOutputNode({
  id,
  data,
  selected,
}: NodeProps<ImageOutData>) {
  const updateNodeData = useUpdateNodeData();
  const edges = useEdges();
  const nodes = useNodes();
  const refNode = getSourceNode(edges, nodes, id, 'ref');
  const refImage =
    refNode?.type === 'inputImage' ? getImageFromNode(refNode) : null;

  const busy = data.runPhase === 'running';

  return (
    <div
      style={{
        ...card,
        minWidth: 340,
        maxWidth: 420,
        outline: selected ? '1px solid rgba(91,140,255,0.45)' : undefined,
      }}
    >
      <TargetHandle id="fromAi" variant="green" top="28%" />
      <TargetHandle id="ref" variant="blue" top="72%" />

      <div style={headerRow}>
        <span style={{ ...headerTitle, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 2,
              background: 'linear-gradient(135deg,#60a5fa,#2563eb)',
            }}
          />
          Image Output
        </span>
        <span style={menuDots}>···</span>
      </div>
      <div style={{ ...bodyPad, paddingBottom: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Oran</span>
          <select
            value={data.aspectRatio ?? '16:9'}
            onChange={(e) =>
              updateNodeData(id, { aspectRatio: e.target.value as AspectRatio })
            }
            disabled={busy}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: 6,
              fontSize: 11,
              color: 'rgba(255,255,255,0.85)',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {aspects.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {data.errorMessage && (
          <p style={{ fontSize: 12, color: 'rgba(248,113,113,0.95)', marginBottom: 8 }}>
            {data.errorMessage}
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: refImage ? '1fr 1fr' : '1fr',
            gap: 8,
            alignItems: 'start',
          }}
        >
          {refImage && (
            <div>
              <p
                style={{
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: 4,
                }}
              >
                Referans
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={refImage}
                alt=""
                style={{
                  width: '100%',
                  borderRadius: 8,
                  border: '1px solid rgba(91,140,255,0.25)',
                  opacity: 0.9,
                }}
              />
            </div>
          )}
          <div>
            <p
              style={{
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.35)',
                marginBottom: 4,
              }}
            >
              Üretilen
            </p>
            {busy && (
              <div
                style={{
                  minHeight: 160,
                  borderRadius: 8,
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: 12,
                }}
              >
                Üretiliyor…
              </div>
            )}
            {!busy && (data.images?.length ?? 0) > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.images.map((im, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${im.url}-${i}`}
                    src={im.url}
                    alt=""
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  />
                ))}
              </div>
            )}
            {!busy && !(data.images?.length ?? 0) && !data.errorMessage && (
              <div
                style={{
                  minHeight: 120,
                  borderRadius: 8,
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px dashed rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.28)',
                }}
              >
                Çalıştır ile üret
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
