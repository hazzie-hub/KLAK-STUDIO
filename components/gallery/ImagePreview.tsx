'use client';

import { useEffect } from 'react';
import { GeneratedImage } from '@/types';

interface ImagePreviewProps {
  image: GeneratedImage;
  onClose: () => void;
}

export default function ImagePreview({ image, onClose }: ImagePreviewProps) {
  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,8,8,0.92)',
        backdropFilter: 'blur(16px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        animation: 'fade-in-up 0.2s ease forwards',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 720,
          width: '100%',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Önizleme
          </span>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-accent)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Image */}
        <div
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid var(--border-default)',
          }}
        >
          <img
            src={image.url}
            alt={image.prompt}
            style={{ width: '100%', display: 'block', maxHeight: '70vh', objectFit: 'contain' }}
          />
        </div>

        {/* Prompt info */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>
            Prompt
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'DM Sans, sans-serif' }}>
            {image.prompt}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <span style={{
              padding: '4px 10px', borderRadius: 6,
              background: 'var(--accent-dim)', border: '1px solid var(--border-accent)',
              fontSize: 11, color: 'var(--accent)', fontFamily: 'DM Sans, sans-serif',
            }}>
              {image.model}
            </span>
            <span style={{
              padding: '4px 10px', borderRadius: 6,
              background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
              fontSize: 11, color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif',
            }}>
              {image.aspectRatio}
            </span>
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
          ESC veya dışarı tıkla kapatmak için
        </p>
      </div>
    </div>
  );
}
