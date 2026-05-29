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
      {/* Desktop sidebar — controlled by .sidebar CSS class */}
      <aside className="sidebar">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 8px', marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
            boxShadow: '0 0 20px rgba(99,102,241,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Dumbbell size={18} color="white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>SimpleGym</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </p>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 12,
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
                transition: 'all 0.15s ease',
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: active ? 'var(--indigo-light)' : 'var(--text-secondary)',
                borderLeft: active ? '2px solid var(--indigo)' : '2px solid transparent',
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
          padding: '10px 16px', borderRadius: 12, width: '100%',
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500,
          cursor: 'pointer', transition: 'all 0.15s ease',
        }}>
          <LogOut size={16} />
          Déconnexion
        </button>
      </aside>

      {/* Mobile bottom nav — controlled by .bottom-nav CSS class */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '4px 12px', borderRadius: 12, textDecoration: 'none',
              color: active ? 'var(--indigo-light)' : 'var(--text-muted)',
              transition: 'color 0.15s ease',
            }}>
              <Icon size={22} />
              <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
