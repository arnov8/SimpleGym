'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dumbbell, Plus, History, TrendingUp, Settings, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/',          icon: Dumbbell,   label: 'Aujourd\'hui' },
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
      <aside
        className="hidden md:flex flex-col w-64 min-h-dvh p-4 gap-2 fixed left-0 top-0"
        style={{ background: 'rgba(10,15,30,0.8)', backdropFilter: 'blur(20px)', borderRight: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center gap-3 px-2 py-4 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}
          >
            <Dumbbell size={18} color="white" />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>SimpleGym</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{displayName}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: active ? 'var(--indigo-light)' : 'var(--text-secondary)',
                  borderLeft: active ? '2px solid var(--indigo)' : '2px solid transparent',
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <button onClick={logout} className="btn-ghost w-full text-sm">
          <LogOut size={16} />
          Déconnexion
        </button>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around pb-safe pt-2 z-50"
        style={{ background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--glass-border)' }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
              style={{ color: active ? 'var(--indigo-light)' : 'var(--text-muted)' }}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
