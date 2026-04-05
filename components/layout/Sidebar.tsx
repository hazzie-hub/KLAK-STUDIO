'use client';

import { MOCK_HISTORY } from '@/lib/mockData';
import { PromptHistoryItem } from '@/types';

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins}dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}sa önce`;
  return `${Math.floor(hrs / 24)}g önce`;
}

interface SidebarProps {
  history?: PromptHistoryItem[];
  activeId?: string | null;
  onSelect?: (item: PromptHistoryItem) => void;
}

export default function Sidebar({
  history = MOCK_HISTORY,
  activeId = null,
  onSelect,
}: SidebarProps) {
  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="klak-logo"
            src="/klak-logo.png"
            alt="KLAK"
            style={{ height: 72, width: 'auto', maxWidth: '100%', display: 'block' }}
          />
        </div>

        {/* Section label */}
        <p
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Prompt Geçmişi
        </p>
      </div>

      {/* History list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {history.length === 0 ? (
          <div
            style={{
              padding: '32px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 8, opacity: 0.4 }}>✦</div>
            Henüz üretim yok.
            <br />
            İlk fikrini yaz ve
            <br />
            Üret'e bas.
          </div>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect?.(item)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 16px',
                background: activeId === item.id ? 'var(--accent-dim)' : 'transparent',
                borderLeft: activeId === item.id
                  ? '2px solid var(--accent)'
                  : '2px solid transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
              onMouseEnter={(e) => {
                if (activeId !== item.id) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeId !== item.id) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }
              }}
            >
              <span
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  maxWidth: '100%',
                }}
              >
                {item.rawInput}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {timeAgo(item.createdAt)}
                {item.images.length > 0 && (
                  <span style={{ marginLeft: 6, color: 'var(--accent)', opacity: 0.7 }}>
                    · {item.images.length} görsel
                  </span>
                )}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <p style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {history.length > 0
            ? `${history.length} üretim · MVP v0.1`
            : 'MVP v0.1 · Mock mod aktif'}
        </p>
      </div>
    </aside>
  );
}
