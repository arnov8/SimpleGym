import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Play, CheckCircle, Clock, Flame, Zap } from 'lucide-react';
import type { Session } from '@/lib/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().split('T')[0];

  const [{ data: todaySession }, { data: recentSessions }, { data: profile }] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, exercises(*, sets_log(*))')
      .eq('profile_id', user.id)
      .eq('date', today)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('sessions')
      .select('id, date, session_name, status, muscles_targeted, estimated_duration')
      .eq('profile_id', user.id)
      .neq('status', 'cancelled')
      .order('date', { ascending: false })
      .limit(7),
    supabase.from('profiles').select('display_name, fitness_level').eq('id', user.id).single(),
  ]);

  const completedThisWeek = (recentSessions ?? []).filter(s => s.status === 'done').length;
  const todayFormatted = format(new Date(), "EEEE d MMMM", { locale: fr });
  const levelLabel = profile?.fitness_level === 'beginner' ? 'Débutant' : profile?.fitness_level === 'intermediate' ? 'Intermédiaire' : 'Avancé';

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{todayFormatted}</p>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--green-deep)', marginTop: 4, letterSpacing: '-0.5px' }}>
          Bonjour, {profile?.display_name?.split(' ')[0] || 'Champion'} 👋
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="glass" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={20} color="var(--orange)" />
          </div>
          <div>
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--green-deep)', lineHeight: 1 }}>{completedThisWeek}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>séances / 7j</p>
          </div>
        </div>
        <div className="glass" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="var(--green-mid)" />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--green-deep)', lineHeight: 1 }}>{levelLabel}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>ton niveau</p>
          </div>
        </div>
      </div>

      {/* Today's session */}
      <section>
        <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Séance du jour
        </h2>
        {todaySession
          ? <TodaySessionCard session={todaySession as Session} />
          : (
            <div className="glass" style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={22} color="var(--green-mid)" />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--green-deep)', fontSize: 15 }}>Aucune séance aujourd'hui</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Génère ton programme avec l'IA</p>
              </div>
              <Link href="/generate" className="btn-primary">
                <Plus size={17} />Générer une séance
              </Link>
            </div>
          )
        }
      </section>

      {/* Recent */}
      {recentSessions && recentSessions.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Récents</h2>
            <Link href="/history" style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-mid)', textDecoration: 'none' }}>Tout voir</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentSessions.slice(0, 4).map(s => <RecentSessionRow key={s.id} session={s} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function TodaySessionCard({ session }: { session: Session }) {
  const isDone = session.status === 'done';
  const isActive = session.status === 'active';
  return (
    <div className="glass-strong hover-lift" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h3 style={{ fontWeight: 800, fontSize: 17, color: 'var(--green-deep)' }}>{session.session_name}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {session.muscles_targeted.slice(0, 3).map(m => <span key={m} className="pill pill-indigo">{m}</span>)}
          </div>
        </div>
        {isDone && <span className="pill pill-green"><CheckCircle size={11} /> Terminée</span>}
        {isActive && <span className="pill pill-orange"><Play size={11} /> En cours</span>}
      </div>
      <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={14} />{session.estimated_duration} min</span>
        <span>{session.exercises?.length ?? 0} exercices</span>
      </div>
      {!isDone && (
        <Link href={`/session/${session.id}`} className={isActive ? 'btn-orange' : 'btn-primary'}>
          <Play size={17} />{isActive ? 'Reprendre' : 'Commencer'}
        </Link>
      )}
    </div>
  );
}

function RecentSessionRow({ session }: { session: Partial<Session> }) {
  const isDone = session.status === 'done';
  return (
    <Link href={`/session/${session.id}`} className="glass hover-lift" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-deep)' }}>{session.session_name}</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, textTransform: 'capitalize' }}>
          {session.date ? format(new Date(session.date + 'T12:00:00'), 'EEE d MMM', { locale: fr }) : ''}
        </p>
      </div>
      <span className={`pill ${isDone ? 'pill-green' : 'pill-indigo'}`}>{isDone ? 'Terminée' : 'Planifiée'}</span>
    </Link>
  );
}
