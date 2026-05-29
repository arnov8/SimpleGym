'use client';

import { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronRight, Dumbbell, Check, Activity, Flame } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';

interface SessionSummary {
  id: string;
  session_name: string;
  date: string;
  estimated_duration: number;
  muscles_targeted: string[];
  exercises?: { name: string; sets: number; reps_target: string; muscle_group: string }[];
}

interface MuscleProgress {
  label: string;
  done: number;
  goal: number;
  color: string;
  track: string;
}

function ProgressRings({ rings, size = 108 }: { rings: { pct: number; color: string; track: string }[]; size?: number }) {
  const stroke = 9, gap = 4;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      {rings.map((r, i) => {
        const radius = size / 2 - stroke / 2 - i * (stroke + gap);
        const circ = 2 * Math.PI * radius;
        return (
          <g key={i}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={r.track} strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={r.color} strokeWidth={stroke}
              strokeLinecap="round" strokeDasharray={`${circ * Math.min(r.pct, 1)} ${circ}`} />
          </g>
        );
      })}
    </svg>
  );
}

export default function ProgressPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('sessions')
        .select('id, session_name, date, estimated_duration, muscles_targeted, exercises(name, sets, reps_target, muscle_group)')
        .eq('status', 'done')
        .order('date', { ascending: false })
        .limit(10);
      setSessions(data ?? []);
      if (data?.[0]) setOpenId(data[0].id);
      setLoading(false);
    };
    load();
  }, []);

  // Compute muscle ring data from recent sessions
  const muscleProgress: MuscleProgress[] = [
    { label: 'Pecs',   done: 0, goal: 16, color: '#0fa36b', track: '#e8efe9' },
    { label: 'Dos',    done: 0, goal: 14, color: '#f97316', track: '#e8efe9' },
    { label: 'Jambes', done: 0, goal: 12, color: '#0ea5a4', track: '#e8efe9' },
  ];

  // Count sets per muscle from sessions
  sessions.slice(0, 5).forEach(s => {
    s.exercises?.forEach(ex => {
      const g = ex.muscle_group.toLowerCase();
      if (g.includes('pec') || g.includes('poitrine') || g.includes('chest'))
        muscleProgress[0].done += ex.sets;
      else if (g.includes('dos') || g.includes('back') || g.includes('dorsal'))
        muscleProgress[1].done += ex.sets;
      else if (g.includes('jambe') || g.includes('quad') || g.includes('leg') || g.includes('fessier'))
        muscleProgress[2].done += ex.sets;
    });
  });

  const rings = muscleProgress.map(m => ({ pct: m.done / m.goal, color: m.color, track: m.track }));
  const dateLabel = format(today, 'EEEE d', { locale: fr });

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 6px' }}>
        <div style={{ width: 34, height: 34, borderRadius: 12, background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px -4px rgba(20,60,40,.25)', border: 'var(--card-border)' }}>
          <Activity size={16} color="var(--ink)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--ink)', textTransform: 'capitalize' }}>{dateLabel}</span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.7, color: 'var(--sub)' }}>
            <ChevronUp size={13} strokeWidth={2.4} />
            <ChevronDown size={13} strokeWidth={2.4} />
          </div>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(140deg,#0fa36b,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>A</div>
      </div>

      <div style={{ padding: '12px 18px 0', display: 'flex', flexDirection: 'column', gap: 13 }}>

        {/* Progress rings card */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 20, padding: '16px 18px', boxShadow: 'var(--card-shadow)', border: 'var(--card-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <ProgressRings rings={rings} size={108} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
            {muscleProgress.map(m => (
              <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, flex: 1, color: 'var(--ink)' }}>{m.label}</span>
                <span style={{ fontSize: 11, color: 'var(--sub)', fontWeight: 600 }}>
                  {m.done} <span style={{ opacity: 0.7 }}>/ {m.goal} séries</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* No sessions state */}
        {!loading && sessions.length === 0 && (
          <div style={{ background: 'var(--card-bg)', borderRadius: 18, padding: '24px 16px', border: 'var(--card-border)', textAlign: 'center' }}>
            <p style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>Aucune séance terminée</p>
            <p style={{ fontSize: 12, color: 'var(--sub)', marginTop: 6 }}>Complète ta première séance pour voir ta progression.</p>
            <Link href="/generate" className="btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>Générer une séance</Link>
          </div>
        )}

        {/* Session accordion */}
        {sessions.map((s, idx) => {
          const isOpen = openId === s.id;
          const ICONS = [Dumbbell, Activity, Flame];
          return (
            <div key={s.id} style={{ background: 'var(--card-bg)', borderRadius: isOpen ? 20 : 18, boxShadow: 'var(--card-shadow)', border: 'var(--card-border)', overflow: 'hidden', transition: 'border-radius 0.2s ease' }}>
              <button
                onClick={() => setOpenId(isOpen ? null : s.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
                  {s.session_name}
                  <span style={{ color: 'var(--sub)', fontWeight: 600, fontSize: 12, marginLeft: 4 }}>· {s.estimated_duration} min</span>
                </p>
                {isOpen
                  ? <ChevronUp size={17} color="var(--sub)" />
                  : <ChevronRight size={17} color="var(--sub)" />
                }
              </button>

              {isOpen && s.exercises && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {s.exercises.map((ex, i) => {
                    const Icon = ICONS[i % ICONS.length];
                    return (
                      <div key={ex.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 15px', borderTop: '1px solid var(--line)' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={17} color="var(--primary)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</p>
                          <p style={{ fontSize: 10.5, color: 'var(--sub)', marginTop: 1 }}>{ex.sets} × {ex.reps_target}</p>
                        </div>
                        <Check size={16} color="var(--c-fg)" strokeWidth={2.6} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
