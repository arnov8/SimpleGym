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
      .select('id, date, session_name, status, muscles_targeted, estimated_duration, completed_at')
      .eq('profile_id', user.id)
      .neq('status', 'cancelled')
      .order('date', { ascending: false })
      .limit(7),
    supabase.from('profiles').select('display_name, fitness_level').eq('id', user.id).single(),
  ]);

  const completedThisWeek = (recentSessions ?? []).filter(s => s.status === 'done').length;
  const streak = completedThisWeek;

  const todayFormatted = format(new Date(), "EEEE d MMMM", { locale: fr });

  return (
    <div className="flex flex-col gap-6 animate-in">
      {/* Header */}
      <div>
        <p className="text-sm capitalize" style={{ color: 'var(--text-muted)' }}>{todayFormatted}</p>
        <h1 className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
          Bonjour, {profile?.display_name?.split(' ')[0] || 'Champion'} 👋
        </h1>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.15)' }}>
            <Flame size={20} style={{ color: 'var(--orange)' }} />
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{streak}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>séances / 7j</p>
          </div>
        </div>
        <div className="glass p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Zap size={20} style={{ color: 'var(--indigo-light)' }} />
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{profile?.fitness_level === 'beginner' ? 'Débutant' : profile?.fitness_level === 'intermediate' ? 'Intermédiaire' : 'Avancé'}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ton niveau</p>
          </div>
        </div>
      </div>

      {/* Today's session */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
          Séance du jour
        </h2>

        {todaySession ? (
          <TodaySessionCard session={todaySession as Session} />
        ) : (
          <div className="glass p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <Plus size={24} style={{ color: 'var(--indigo-light)' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Aucune séance aujourd'hui</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Génère ton programme avec l'IA</p>
            </div>
            <Link href="/generate" className="btn-primary">
              <Plus size={18} />
              Générer une séance
            </Link>
          </div>
        )}
      </section>

      {/* Recent sessions */}
      {recentSessions && recentSessions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Récents
            </h2>
            <Link href="/history" className="text-xs font-medium" style={{ color: 'var(--indigo-light)' }}>Tout voir</Link>
          </div>
          <div className="flex flex-col gap-2">
            {recentSessions.slice(0, 4).map(s => (
              <RecentSessionRow key={s.id} session={s} />
            ))}
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
    <div className="glass-strong p-5 flex flex-col gap-4 hover-lift">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{session.session_name}</h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {session.muscles_targeted.slice(0, 3).map(m => (
              <span key={m} className="pill pill-indigo">{m}</span>
            ))}
          </div>
        </div>
        {isDone && <span className="pill pill-green"><CheckCircle size={12} /> Terminée</span>}
        {isActive && <span className="pill pill-orange"><Play size={12} /> En cours</span>}
      </div>

      <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1"><Clock size={14} />{session.estimated_duration} min</span>
        <span>{session.exercises?.length ?? 0} exercices</span>
      </div>

      {!isDone && (
        <Link href={`/session/${session.id}`} className={isActive ? 'btn-orange' : 'btn-primary'}>
          <Play size={18} />
          {isActive ? 'Reprendre la séance' : 'Commencer la séance'}
        </Link>
      )}
    </div>
  );
}

function RecentSessionRow({ session }: { session: Partial<Session> }) {
  const isDone = session.status === 'done';
  return (
    <Link
      href={`/session/${session.id}`}
      className="glass p-3.5 flex items-center justify-between hover-lift"
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{session.session_name}</p>
        <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>
          {session.date ? format(new Date(session.date + 'T12:00:00'), 'EEE d MMM', { locale: fr }) : ''}
        </p>
      </div>
      <span className={`pill ${isDone ? 'pill-green' : 'pill-indigo'}`}>
        {isDone ? 'Terminée' : 'Planifiée'}
      </span>
    </Link>
  );
}
