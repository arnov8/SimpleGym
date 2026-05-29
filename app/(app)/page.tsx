import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Sparkles, Play, Dumbbell, Activity, Clock, Plus, History } from 'lucide-react';
import type { Session } from '@/lib/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().split('T')[0];

  const [{ data: todaySession }, { data: recentSessions }, { data: profile }] = await Promise.all([
    supabase
      .from('sessions')
      .select('*, exercises(*)')
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
      .eq('status', 'done')
      .order('date', { ascending: false })
      .limit(4),
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
  ]);

  const firstName = profile?.display_name?.split(' ')[0] || 'Champion';
  const initial = firstName[0]?.toUpperCase() ?? 'A';

  // Popular exercises from recent sessions
  const popularExercises = [
    { name: 'Développé couché', sets: '16 séries', dur: '1h 20', icon: 'dumbbell' },
    { name: 'Squat barre', sets: '11 séries', dur: '0h 45', icon: 'activity' },
  ];

  return (
    <div className="animate-in" style={{ padding: '10px 0 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px 0' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 12, background: 'var(--card-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 3px 8px -4px rgba(20,60,40,.25)', border: 'var(--card-border)',
        }}>
          <Dumbbell size={16} color="var(--ink)" />
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.2px' }}>Accueil</span>
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(140deg, #0fa36b, #f97316)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 14,
          boxShadow: '0 0 0 2px #fff, 0 4px 10px -3px rgba(20,60,40,.25)',
        }}>{initial}</div>
      </div>

      {/* Greeting */}
      <div style={{ padding: '0 18px' }}>
        <p style={{ fontSize: 13, color: 'var(--sub)', fontWeight: 500 }}>Salut {firstName},</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginTop: 2, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
          En forme aujourd'hui 💪
        </h1>
      </div>

      {/* Hero — séance du jour */}
      <div style={{ padding: '0 18px' }}>
        {todaySession ? (
          <HeroSession session={todaySession as Session} />
        ) : (
          <HeroEmpty />
        )}
      </div>

      {/* Exercices populaires */}
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--ink)' }}>
            {recentSessions && recentSessions.length > 0 ? 'Séances récentes' : 'Exercices populaires'}
          </h3>
          <Link href="/history" style={{
            fontSize: 11, fontWeight: 700, color: 'var(--a-fg)',
            background: 'var(--a-bg)', padding: '4px 10px', borderRadius: 20,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>Tout voir</Link>
        </div>

        {recentSessions && recentSessions.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {recentSessions.slice(0, 4).map(s => (
              <RecentCard key={s.id} session={s} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {popularExercises.map(e => (
              <PopularCard key={e.name} exercise={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HeroSession({ session }: { session: Session }) {
  const isActive = session.status === 'active';
  const isDone = session.status === 'done';
  const href = isDone ? '/history' : `/session/${session.id}`;

  return (
    <Link href={href} style={{
      display: 'block', position: 'relative', borderRadius: 22,
      padding: '18px 17px', overflow: 'hidden',
      background: 'var(--hero-grad)', color: '#fff',
      boxShadow: 'var(--hero-shadow)', textDecoration: 'none',
    }}>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 200 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 10.5, fontWeight: 700, padding: '4px 9px', borderRadius: 20,
          background: 'rgba(255,255,255,.20)', color: '#fff',
        }}>
          <Sparkles size={11} /> {isDone ? 'Terminée ✓' : 'Généré par l\'IA'}
        </span>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 10, letterSpacing: '-0.3px', lineHeight: 1.12, color: '#fff' }}>
          {session.session_name}
        </h2>
        <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,.88)', marginTop: 5, lineHeight: 1.3 }}>
          {session.exercises?.length ?? 0} exercices ciblés pour toi
        </p>
        {!isDone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={14} color="#0fa36b" fill="#0fa36b" />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#fff' }}>
              {isActive ? 'Reprendre · ' : ''}{session.estimated_duration} minutes
            </span>
          </div>
        )}
      </div>
      {/* Decorative dumbbell */}
      <div style={{ position: 'absolute', right: -14, bottom: -18, zIndex: 1, opacity: 0.92 }}>
        <Dumbbell size={150} color="rgba(255,255,255,.16)" strokeWidth={1.4} />
      </div>
      {/* Flame accent */}
      <div style={{ position: 'absolute', right: 18, top: 16, zIndex: 1 }}>
        <Sparkles size={26} color="rgba(255,255,255,.32)" strokeWidth={1.6} />
      </div>
    </Link>
  );
}

function HeroEmpty() {
  return (
    <Link href="/generate" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative', borderRadius: 22, padding: '28px 17px',
      overflow: 'hidden', background: 'var(--hero-grad)', color: '#fff',
      boxShadow: 'var(--hero-shadow)', textDecoration: 'none', gap: 12, textAlign: 'center',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={22} color="white" strokeWidth={2.6} />
      </div>
      <div>
        <p style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>Aucune séance aujourd'hui</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', marginTop: 4 }}>Génère ton programme avec l'IA</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.2)', padding: '8px 16px', borderRadius: 12 }}>
        <Sparkles size={14} color="white" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Générer une séance</span>
      </div>
      <div style={{ position: 'absolute', right: -14, bottom: -18, opacity: 0.92 }}>
        <Dumbbell size={120} color="rgba(255,255,255,.16)" strokeWidth={1.4} />
      </div>
    </Link>
  );
}

function RecentCard({ session }: { session: Partial<Session> }) {
  return (
    <Link href={`/session/${session.id}`} style={{
      background: 'var(--card-bg)', borderRadius: 18,
      padding: '14px 13px', border: 'var(--card-border)',
      boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column',
      gap: 10, textDecoration: 'none',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Dumbbell size={20} color="var(--primary)" />
      </div>
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {session.session_name}
        </p>
        <p style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2, textTransform: 'capitalize' }}>
          {session.date ? format(new Date(session.date + 'T12:00:00'), 'EEE d MMM', { locale: fr }) : ''}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--sub)', fontSize: 11 }}>
        <Clock size={12} color="var(--sub)" />
        {session.estimated_duration} min
      </div>
    </Link>
  );
}

function PopularCard({ exercise }: { exercise: { name: string; sets: string; dur: string; icon: string } }) {
  return (
    <div style={{
      background: 'var(--card-bg)', borderRadius: 18, padding: '14px 13px',
      border: 'var(--card-border)', boxShadow: 'var(--card-shadow)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {exercise.icon === 'activity' ? <Activity size={20} color="var(--primary)" /> : <Dumbbell size={20} color="var(--primary)" />}
      </div>
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {exercise.name}
        </p>
        <p style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>{exercise.sets}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--sub)', fontSize: 11 }}>
        <Clock size={12} color="var(--sub)" /> {exercise.dur}
      </div>
    </div>
  );
}
