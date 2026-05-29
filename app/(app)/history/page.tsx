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
    .select('id, date, session_name, status, muscles_targeted, estimated_duration')
    .eq('profile_id', user.id)
    .neq('status', 'cancelled')
    .order('date', { ascending: false })
    .limit(50);

  const doneCount = sessions?.filter(s => s.status === 'done').length ?? 0;
  const grouped = groupByMonth(sessions ?? []);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Header */}
      <div style={{ padding: '24px 20px 20px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.4px' }}>Historique</h1>
        <p style={{ fontSize: 13.5, color: 'var(--sub)', marginTop: 4, fontWeight: 500 }}>
          {doneCount} séance{doneCount !== 1 ? 's' : ''} terminée{doneCount !== 1 ? 's' : ''}
        </p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ padding: '0 20px' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 20, padding: '36px 20px', border: 'var(--card-border)', boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Dumbbell size={26} color="var(--primary)" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>Aucune séance pour l'instant</p>
              <p style={{ fontSize: 13, color: 'var(--sub)', marginTop: 4 }}>Lance ta première séance avec l'IA</p>
            </div>
            <Link href="/generate" className="btn-primary" style={{ marginTop: 4 }}>Générer ma première séance</Link>
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(grouped).map(([month, list]) => (
            <section key={month}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--sub)', textTransform: 'capitalize', letterSpacing: '0.06em', marginBottom: 10 }}>
                {month}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {list.map(s => <HistoryCard key={s.id} session={s} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryCard({ session }: { session: Partial<Session> }) {
  const isDone = session.status === 'done';
  return (
    <Link href={`/session/${session.id}`} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
      background: 'var(--card-bg)', borderRadius: 18, border: 'var(--card-border)',
      boxShadow: 'var(--card-shadow)', textDecoration: 'none',
      transition: 'transform .15s ease',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 13, flexShrink: 0,
        background: isDone ? 'var(--primary-soft)' : 'var(--faint)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isDone
          ? <CheckCircle size={20} color="var(--primary)" />
          : <Clock size={20} color="var(--sub)" />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {session.session_name}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 500, textTransform: 'capitalize' }}>
            {session.date ? format(new Date(session.date + 'T12:00:00'), 'EEE d MMM', { locale: fr }) : ''}
          </span>
          {session.estimated_duration && (
            <span style={{ fontSize: 12, color: 'var(--sub)' }}>· {session.estimated_duration} min</span>
          )}
        </div>
        {session.muscles_targeted && session.muscles_targeted.length > 0 && (
          <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
            {session.muscles_targeted.slice(0, 3).map(m => (
              <span key={m} style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '2px 8px', borderRadius: 20 }}>
                {m}
              </span>
            ))}
          </div>
        )}
      </div>
      <ChevronRight size={17} color="var(--sub)" />
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
