'use client';

import StudioTopNav from '@/components/layout/StudioTopNav';

interface MainCanvasProps {
  children?: React.ReactNode;
}

export default function MainCanvas({ children }: MainCanvasProps) {
  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 52,
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <StudioTopNav active="generate" />
      </div>

      {/* Scrollable content area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 'var(--inputbar-height)',
        }}
      >
        {children || <EmptyState />}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 40,
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,214,10,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          border: '1px solid var(--border-default)',
          background: 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="3" width="22" height="22" rx="3" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
          <circle cx="10" cy="11" r="2.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
          <path d="M3 18L8.5 12.5L13 17L18 11L25 18" stroke="rgba(255,214,10,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center' }}>
        <h2
          className="font-display"
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: 8,
          }}
        >
          Fikrinden görsel üret
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            maxWidth: 340,
            lineHeight: 1.6,
          }}
        >
          Aşağıya bir fikir yaz ya da mikrofona bas.
          Sistem onu sinematik bir görsel prompt'una dönüştürür.
        </p>
      </div>

      {/* Hint chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        {[
          'yağmurlu Tokyo sokakları',
          'antik bir kütüphane',
          'uzayda astronot',
        ].map((hint) => (
          <span
            key={hint}
            style={{
              padding: '6px 14px',
              borderRadius: 100,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLSpanElement).style.borderColor = 'var(--accent)';
              (e.currentTarget as HTMLSpanElement).style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLSpanElement).style.borderColor = 'var(--border-default)';
              (e.currentTarget as HTMLSpanElement).style.color = 'var(--text-secondary)';
            }}
          >
            {hint}
          </span>
        ))}
      </div>
    </div>
  );
}
