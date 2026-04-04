'use client';

import { useState, useRef, useEffect } from 'react';
import { AIModel } from '@/types';
import { AI_MODELS } from '@/lib/mockData';

interface ModelSelectorProps {
  value: AIModel;
  onChange: (model: AIModel) => void;
  disabled?: boolean;
}

export default function ModelSelector({ value, onChange, disabled = false }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = AI_MODELS.find((m) => m.value === value) ?? AI_MODELS[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        style={{
          height: 48,
          padding: '0 14px',
          borderRadius: 12,
          background: open ? 'var(--bg-overlay)' : 'var(--bg-elevated)',
          border: `1px solid ${open ? 'var(--border-accent)' : 'var(--border-default)'}`,
          color: 'var(--text-secondary)',
          fontSize: 12.5,
          fontFamily: 'DM Sans, sans-serif',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.15s ease',
          opacity: disabled ? 0.5 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        {/* Model icon */}
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--accent)',
            opacity: 0.8,
          }}
        />
        {selected.label}
        {/* Chevron */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{ transition: 'transform 0.15s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            overflow: 'hidden',
            minWidth: 140,
            zIndex: 100,
            animation: 'fade-in-up 0.15s ease forwards',
          }}
        >
          {AI_MODELS.map((model) => (
            <button
              key={model.value}
              onClick={() => { onChange(model.value as AIModel); setOpen(false); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: model.value === value ? 'var(--accent-dim)' : 'transparent',
                border: 'none',
                color: model.value === value ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 12.5,
                fontFamily: 'DM Sans, sans-serif',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (model.value !== value)
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                if (model.value !== value)
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: model.value === value ? 'var(--accent)' : 'var(--border-default)' }} />
              {model.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
