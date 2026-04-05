'use client';

import { useRef } from 'react';

interface MicButtonProps {
  isListening: boolean;
  onPointerDownHold: () => void;
  onPointerUpHold: () => void;
  disabled?: boolean;
}

export default function MicButton({
  isListening,
  onPointerDownHold,
  onPointerUpHold,
  disabled = false,
}: MicButtonProps) {
  const pressedRef = useRef(false);

  const endIfPressed = () => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    onPointerUpHold();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? 'Ses girişi desteklenmiyor' : 'Basılı tut ve konuş (tr-TR)'}
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: isListening ? 'rgba(255,214,10,0.12)' : 'var(--bg-elevated)',
        border: `1px solid ${isListening ? 'var(--accent)' : 'var(--border-default)'}`,
        color: isListening ? 'var(--accent)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerDown={(e) => {
        if (disabled) return;
        e.preventDefault();
        pressedRef.current = true;
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
        onPointerDownHold();
      }}
      onPointerUp={endIfPressed}
      onPointerCancel={endIfPressed}
      onPointerLeave={(e) => {
        if (e.buttons === 0) return;
        endIfPressed();
      }}
      onLostPointerCapture={() => {
        endIfPressed();
      }}
      onMouseEnter={(e) => {
        if (!isListening && !disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-accent)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isListening) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-default)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
        }
      }}
    >
      {/* Ping animation when listening */}
      {isListening && (
        <span style={{
          position: 'absolute',
          inset: -4,
          borderRadius: 16,
          border: '1px solid var(--accent)',
          opacity: 0.4,
          animation: 'glow-pulse 1.2s ease infinite',
        }} />
      )}

      <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
        <rect x="6" y="1" width="6" height="10" rx="3"
          stroke="currentColor" strokeWidth="1.5"
          fill={isListening ? 'rgba(255,214,10,0.15)' : 'none'}
        />
        <path d="M3 9C3 12.314 5.686 15 9 15C12.314 15 15 12.314 15 9"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="9" y1="15" x2="9" y2="17"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}
