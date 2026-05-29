'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dumbbell, Plus, History, TrendingUp, Settings, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/',         icon: Dumbbell,   label: "Aujourd'hui" },
  { href: '/generate', icon: Plus,       label: 'Générer'     },
  { href: '/history',  icon: History,    label: 'Historique'  },
  { href: '/progress', icon: TrendingUp, label: 'Progression' },
  { href: '/settings', icon: Settings,   label: 'Réglages'    },
];

export default function Navigation({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px', marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #10b981, #0d5e3a)',
            boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Dumbbell size={20} color="white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--green-deep)', letterSpacing: '-0.3px' }}>
              SimpleGym
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </p>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', borderRadius: 12,
                fontSize: 14, fontWeight: active ? 700 : 500, textDecoration: 'none',
                transition: 'all 0.15s ease',
                background: active ? 'rgba(16,185,129,0.14)' : 'transparent',
                color: active ? 'var(--green-deep)' : 'var(--text-secondary)',
                boxShadow: active ? 'inset 3px 0 0 var(--green-mid)' : 'none',
              }}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '11px 16px', borderRadius: 12, width: '100%', marginTop: 8,
          background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.85)',
          color: 'var(--text-muted)', fontSize: 14, fontWeight: 500,
          cursor: 'pointer', transition: 'all 0.15s ease',
        }}>
          <LogOut size={16} />
          Déconnexion
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '4px 12px', borderRadius: 12, textDecoration: 'none',
              color: active ? 'var(--green-deep)' : 'var(--text-muted)',
              transition: 'color 0.15s ease',
            }}>
              <Icon size={22} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
