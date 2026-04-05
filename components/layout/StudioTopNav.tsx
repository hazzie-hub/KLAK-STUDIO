import type { CSSProperties } from 'react';
import Link from 'next/link';

export type StudioNavActive = 'generate' | 'workflow';

function navLinkStyle(active: boolean): CSSProperties {
  return {
    fontSize: 11,
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    textDecoration: 'none',
    letterSpacing: active ? '0.08em' : '0.04em',
    textTransform: 'uppercase',
    fontWeight: active ? 600 : 500,
    transition: 'color 0.15s ease',
  };
}

export default function StudioTopNav({ active }: { active: StudioNavActive }) {
  const isGenerate = active === 'generate';
  const isWorkflow = active === 'workflow';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Link href="/" style={navLinkStyle(isGenerate)} prefetch>
        Generate
      </Link>
      <span style={{ color: 'var(--border-default)', fontSize: 10 }}>·</span>
      <Link href="/workflow" style={navLinkStyle(isWorkflow)} prefetch>
        Workflow
      </Link>
    </div>
  );
}
