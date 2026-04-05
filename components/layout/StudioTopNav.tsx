'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function navLinkStyle(active: boolean): React.CSSProperties {
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

export default function StudioTopNav() {
  const pathname = usePathname();
  const isGenerate = pathname === '/' || pathname === '';
  const isWorkflow = pathname?.startsWith('/workflow') ?? false;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Link href="/" style={navLinkStyle(isGenerate)}>
        Generate
      </Link>
      <span style={{ color: 'var(--border-default)', fontSize: 10 }}>·</span>
      <Link href="/workflow" style={navLinkStyle(isWorkflow)}>
        Workflow
      </Link>
    </div>
  );
}
