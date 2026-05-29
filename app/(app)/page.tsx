import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Sparkles, Play, Dumbbell, Clock, Plus } from 'lucide-react';
import type { Session } from '@/lib/types';

const S = {
  page:    { display: 'flex', flexDirection: 'column' as const, gap: 0 },
  topBar:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 8px' },
  section: { padding: '0 20px', display: 'flex', flexDirection: 'column' as const, gap: 12 },
  label:   { fontSize: 11, fontWeight: 700 as const, color: 'var(--sub)', textTransform: 'uppercase' as const, letterSpacing: '0.07em' },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().split('T')[0];

  const [{ data: todaySession }, { data: recentSessions }, { data: profile }] = await Promise.all([
    supabase.from('sessions').select('*, exercises(*)').eq('profile_id', user.id).eq('date', today).neq('status', 'cancelled').order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('sessions').select('id, date, session_name, status, muscles_targeted, estimated_duration').eq('profile_id', user.id).eq('status', 'done').order('date', { ascending: false }).limit(4),
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
  ]);

  const firstName = profile?.display_name?.split(' ')[0] || 'Champion';
  const initial = firstName[0]?.toUpperCase() ?? 'A';

  return (
    <div className="animate-in" style={S.page}>

      {/* Top bar */}
      <div style={S.topBar}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--card-bg)', border: 'var(--card-border)', boxShadow: '0 2px 8px -4px rgba(20,60,40,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Dumbbell size={17} color="var(--primary)" />
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.2px' }}>Accueil</span>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(140deg,#0fa36b,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, boxShadow: '0 0 0 2px #fff, 0 3px 10px -4px rgba(20,60,40,.25)' }}>
          {initial}
        </div>
      </div>

      {/* Greeting */}
      <div style={{ padding: '4px 20px 20px' }}>
        <p style={{ fontSize: 13, color: 'var(--sub)', fontWeight: 500 }}>Salut {firstName},</p>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginTop: 2, color: 'var(--ink)' }}>En forme aujourd'hui 💪</h1>
      </div>

      {/* Hero */}
      <div style={{ padding: '0 20px' }}>
        {todaySession ? <HeroSession session={todaySession as Session} /> : <HeroEmpty />}
      </div>

      {/* Recent sessions */}
      <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--ink)' }}>
            {recentSessions && recentSessions.length > 0 ? 'Séances récentes' : 'Commencer'}
          </h3>
          {recentSessions && recentSessions.length > 0 && (
            <Link href="/history" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '5px 12px', borderRadius: 20, textDecoration: 'none' }}>
              Tout voir
            </Link>
          )}
        </div>

        {recentSessions && recentSessions.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {recentSessions.slice(0, 4).map(s => <RecentCard key={s.id} session={s} />)}
          </div>
        ) : (
          <Link href="/generate" style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 18,
            background: 'var(--card-bg)', border: 'var(--card-border)', boxShadow: 'var(--card-shadow)',
            textDecoration: 'none',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Plus size={22} color="var(--primary)" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>Générer ma première séance</p>
              <p style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>L'IA crée ton programme</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

function HeroSession({ session }: { session: Session }) {
  const isDone = session.status === 'done';
  const isActive = session.status === 'active';
  return (
    <Link href={isDone ? '/history' : `/session/${session.id}`} style={{
      display: 'block', position: 'relative', borderRadius: 22, padding: '20px', overflow: 'hidden',
      background: 'var(--hero-grad)', boxShadow: 'var(--hero-shadow)', textDecoration: 'none',
    }}>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 220 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 20, background: 'rgba(255,255,255,.2)', color: '#fff', marginBottom: 10 }}>
          <Sparkles size={11} color="#fff" /> {isDone ? 'Séance terminée ✓' : 'Généré par l\'IA'}
        </span>
        <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.4px', lineHeight: 1.15, color: '#fff' }}>{session.session_name}</h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', marginTop: 6 }}>
          {session.exercises?.length ?? 0} exercices ciblés pour toi
        </p>
        {!isDone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={14} color="#0fa36b" fill="#0fa36b" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {isActive ? 'Reprendre · ' : ''}{session.estimated_duration} min
            </span>
          </div>
        )}
      </div>
      <Dumbbell size={140} color="rgba(255,255,255,.13)" strokeWidth={1.3} style={{ position: 'absolute', right: -16, bottom: -20, zIndex: 1 }} />
      <Sparkles size={24} color="rgba(255,255,255,.3)" strokeWidth={1.5} style={{ position: 'absolute', right: 20, top: 18, zIndex: 1 }} />
    </Link>
  );
}

function HeroEmpty() {
  return (
    <Link href="/generate" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', borderRadius: 22, padding: '28px 20px', overflow: 'hidden',
      background: 'var(--hero-grad)', boxShadow: 'var(--hero-shadow)', textDecoration: 'none', gap: 12, textAlign: 'center',
    }}>
      <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={24} color="white" strokeWidth={2.5} />
      </div>
      <div>
        <p style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>Aucune séance aujourd'hui</p>
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,.82)', marginTop: 5 }}>Génère ton programme avec l'IA</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.18)', padding: '9px 18px', borderRadius: 14, marginTop: 4 }}>
        <Sparkles size={14} color="white" />
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'white' }}>Générer une séance</span>
      </div>
      <Dumbbell size={120} color="rgba(255,255,255,.13)" strokeWidth={1.3} style={{ position: 'absolute', right: -12, bottom: -16 }} />
    </Link>
  );
}

function RecentCard({ session }: { session: Partial<Session> }) {
  return (
    <Link href={`/session/${session.id}`} style={{ background: 'var(--card-bg)', borderRadius: 18, padding: '14px', border: 'var(--card-border)', boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column', gap: 10, textDecoration: 'none' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Dumbbell size={20} color="var(--primary)" />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.session_name}</p>
        <p style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2, textTransform: 'capitalize' }}>
          {session.date ? format(new Date(session.date + 'T12:00:00'), 'EEE d MMM', { locale: fr }) : ''}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--sub)', fontSize: 11 }}>
        <Clock size={12} color="var(--sub)" strokeWidth={2} />{session.estimated_duration} min
      </div>
    </Link>
  );
}
