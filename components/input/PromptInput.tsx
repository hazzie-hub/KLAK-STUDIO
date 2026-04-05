'use client';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isListening?: boolean;
}

export default function PromptInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isListening = false,
}: PromptInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSubmit();
    }
  };

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={isListening ? 'Dinleniyor...' : 'Bir fikir yaz veya mikrofona bas...'}
        rows={1}
        style={{
          width: '100%',
          height: 48,
          borderRadius: 12,
          background: 'var(--bg-elevated)',
          border: `1px solid ${isListening ? 'var(--accent)' : 'var(--border-default)'}`,
          color: 'var(--text-primary)',
          fontSize: 14,
          padding: '0 16px',
          resize: 'none',
          outline: 'none',
          lineHeight: '48px',
          overflowY: 'hidden',
          transition: 'border-color 0.2s ease',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onFocus={(e) => {
          if (!isListening) e.target.style.borderColor = 'var(--border-accent)';
        }}
        onBlur={(e) => {
          if (!isListening) e.target.style.borderColor = 'var(--border-default)';
        }}
      />
      {isListening && (
        <div
          style={{
            position: 'absolute',
            right: 14,
            display: 'flex',
            gap: 3,
            alignItems: 'center',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: 12,
                borderRadius: 2,
                background: 'var(--accent)',
                animation: `glow-pulse 0.8s ease infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
