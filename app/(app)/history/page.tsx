import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, Clock, ChevronRight, Dumbbell } from 'lucide-react';
import type { Session } from '@/lib/types';

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, date, session_name, status, muscles_targeted, estimated_duration, completed_at')
    .eq('profile_id', user.id)
    .neq('status', 'cancelled')
    .order('date', { ascending: false })
    .limit(50);

  const grouped = groupByMonth(sessions ?? []);

  return (
    <div className="flex flex-col gap-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Historique</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {sessions?.filter(s => s.status === 'done').length ?? 0} séances terminées
        </p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="glass p-8 flex flex-col items-center gap-3 text-center">
          <Dumbbell size={32} style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Aucune séance pour l'instant.</p>
          <Link href="/generate" className="btn-primary">Générer ma première séance</Link>
        </div>
      ) : (
        Object.entries(grouped).map(([month, sessions]) => (
          <section key={month}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3 capitalize" style={{ color: 'var(--text-muted)' }}>
              {month}
            </p>
            <div className="flex flex-col gap-2">
              {sessions.map(s => <HistoryCard key={s.id} session={s} />)}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function HistoryCard({ session }: { session: Partial<Session> }) {
  const isDone = session.status === 'done';
  return (
    <Link href={`/session/${session.id}`} className="glass p-4 flex items-center gap-3 hover-lift">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: isDone ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.1)' }}
      >
        {isDone
          ? <CheckCircle size={20} style={{ color: '#4ade80' }} />
          : <Clock size={20} style={{ color: 'var(--indigo-light)' }} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{session.session_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
            {session.date ? format(new Date(session.date + 'T12:00:00'), 'EEE d MMM', { locale: fr }) : ''}
          </span>
          {session.estimated_duration && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {session.estimated_duration} min</span>
          )}
        </div>
        {session.muscles_targeted && session.muscles_targeted.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {session.muscles_targeted.slice(0, 3).map(m => (
              <span key={m} className="pill pill-indigo" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>{m}</span>
            ))}
          </div>
        )}
      </div>
      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
    </Link>
  );
}

function groupByMonth(sessions: Partial<Session>[]): Record<string, Partial<Session>[]> {
  const groups: Record<string, Partial<Session>[]> = {};
  for (const s of sessions) {
    if (!s.date) continue;
    const key = format(new Date(s.date + 'T12:00:00'), 'MMMM yyyy', { locale: fr });
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }
  return groups;
}
