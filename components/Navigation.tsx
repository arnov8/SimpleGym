'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Plus, BarChart3, Settings, History,
  Dumbbell, LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/',         icon: Home,     label: 'Accueil'    },
  { href: '/history',  icon: History,  label: 'Historique' },
  { href: '/generate', icon: null,     label: 'Générer',   fab: true },
  { href: '/progress', icon: BarChart3,label: 'Progrès'    },
  { href: '/settings', icon: Settings, label: 'Réglages'   },
];

const SIDEBAR_ITEMS = [
  { href: '/',          icon: Home,     label: "Aujourd'hui" },
  { href: '/generate',  icon: Plus,     label: 'Générer'     },
  { href: '/history',   icon: History,  label: 'Historique'  },
  { href: '/progress',  icon: BarChart3,label: 'Progression' },
  { href: '/settings',  icon: Settings, label: 'Réglages'    },
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

  const initial = displayName?.[0]?.toUpperCase() ?? 'A';

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', marginBottom: 16 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: 'var(--primary)',
            boxShadow: '0 6px 16px -6px rgba(15,163,107,.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Dumbbell size={19} color="white" />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', letterSpacing: '-0.3px' }}>SimpleGym</p>
            <p style={{ fontSize: 11, color: 'var(--sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {SIDEBAR_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 12,
                fontSize: 13.5, fontWeight: active ? 700 : 600, textDecoration: 'none',
                transition: 'all 0.15s ease',
                background: active ? 'var(--primary-soft)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--sub)',
              }}>
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 12, width: '100%',
          background: 'transparent', border: 'none',
          color: 'var(--sub)', fontSize: 13.5, fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s ease',
        }}>
          <LogOut size={16} />Déconnexion
        </button>
      </aside>

      {/* Mobile bottom nav — FAB central */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ href, icon: Icon, label, fab }) => {
          const active = pathname === href;

          if (fab) return (
            <Link key={href} href={href} style={{
              width: 50, height: 50, borderRadius: 18,
              background: 'var(--primary)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 22px -6px rgba(15,163,107,.6)',
              marginTop: -14, textDecoration: 'none',
            }}>
              <Plus size={24} color="white" strokeWidth={2.6} />
            </Link>
          );

          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '4px 10px', textDecoration: 'none',
              color: active ? 'var(--primary)' : 'var(--sub)',
            }}>
              {Icon && <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />}
              <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
