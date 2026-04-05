'use client';

import { useState, useRef, useEffect } from 'react';
import { AspectRatio } from '@/types';
import { ASPECT_RATIOS } from '@/lib/mockData';

interface AspectSelectorProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
  disabled?: boolean;
}

function AspectIcon({ ratio }: { ratio: string }) {
  const dims: Record<string, { w: number; h: number }> = {
    '1:1':  { w: 12, h: 12 },
    '16:9': { w: 16, h: 9 },
    '9:16': { w: 9,  h: 14 },
    '4:3':  { w: 14, h: 10 },
    '3:4':  { w: 10, h: 14 },
  };
  const d = dims[ratio] ?? { w: 12, h: 12 };
  return (
    <div style={{
      width: d.w,
      height: d.h,
      border: '1.5px solid currentColor',
      borderRadius: 2,
      opacity: 0.6,
      flexShrink: 0,
    }} />
  );
}

export default function AspectSelector({ value, onChange, disabled = false }: AspectSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.15s ease',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <AspectIcon ratio={value} />
        {value}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{ transition: 'transform 0.15s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: 0,
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-default)',
          borderRadius: 12,
          overflow: 'hidden',
          minWidth: 120,
          zIndex: 100,
          animation: 'fade-in-up 0.15s ease forwards',
        }}>
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r.value}
              onClick={() => { onChange(r.value as AspectRatio); setOpen(false); }}
              style={{
                width: '100%',
                padding: '9px 14px',
                background: r.value === value ? 'var(--accent-dim)' : 'transparent',
                border: 'none',
                color: r.value === value ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 12.5,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (r.value !== value)
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                if (r.value !== value)
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <AspectIcon ratio={r.value} />
              {r.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
