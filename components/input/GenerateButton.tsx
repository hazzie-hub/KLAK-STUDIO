'use client';

interface GenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function GenerateButton({ onClick, disabled = false, isLoading = false }: GenerateButtonProps) {
  const inactive = disabled || isLoading;

  return (
    <button
      type="button"
      className="neon-solid-btn"
      onClick={onClick}
      disabled={inactive}
      style={{
        height: 48,
        padding: '0 20px',
        borderRadius: 12,
        cursor: inactive ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
        transform: 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!inactive) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
      onMouseDown={(e) => {
        if (!inactive) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
      }}
      onMouseUp={(e) => {
        if (!inactive) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)';
      }}
    >
      {isLoading ? (
        <>
          <div style={{
            width: 14,
            height: 14,
            border: '2px solid rgba(10,10,12,0.25)',
            borderTopColor: 'var(--neon-solid-text)',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--neon-solid-text)',
            letterSpacing: '-0.01em',
          }}>
            Üretiliyor...
          </span>
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L9.5 6H14.5L10.5 9L12 14L8 11L4 14L5.5 9L1.5 6H6.5L8 1Z" fill="currentColor" />
          </svg>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--neon-solid-text)',
            letterSpacing: '-0.01em',
          }}>
            Üret
          </span>
        </>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
