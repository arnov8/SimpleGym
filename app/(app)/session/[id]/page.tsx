'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronDown, ChevronUp, CheckCircle, Circle,
  Minus, Plus, Clock, Play, Trophy, ArrowLeft, Timer, Dumbbell
} from 'lucide-react';
import type { Session, Exercise, SetLog } from '@/lib/types';

interface ExerciseWithSets extends Exercise { sets_log: SetLog[]; }
interface SessionWithExercises extends Session { exercises: ExerciseWithSets[]; }

const MUSCLE_COLORS: Record<string, string> = {
  pectoraux: '#10b981', poitrine: '#10b981', chest: '#10b981',
  dos: '#6366f1', dorsaux: '#6366f1', back: '#6366f1',
  épaules: '#f97316', deltoïdes: '#f97316', shoulders: '#f97316',
  biceps: '#ec4899', bras: '#ec4899',
  triceps: '#8b5cf6',
  quadriceps: '#0ea5e9', jambes: '#0ea5e9', legs: '#0ea5e9',
  ischio: '#14b8a6', fessiers: '#14b8a6', glutes: '#14b8a6',
  abdominaux: '#f59e0b', core: '#f59e0b', abdo: '#f59e0b',
  mollets: '#64748b',
};

function muscleColor(group: string) {
  const key = group.toLowerCase();
  return Object.entries(MUSCLE_COLORS).find(([k]) => key.includes(k))?.[1] ?? '#10b981';
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionWithExercises | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState(0);
  const [restTimer, setRestTimer] = useState({ seconds: 0, running: false });
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${id}`);
    if (!res.ok) { router.push('/'); return; }
    const data: SessionWithExercises = await res.json();
    setSession(data);
    setLoading(false);
    if (data.status === 'done') setDone(true);
  }, [id, router]);

  useEffect(() => { loadSession(); }, [loadSession]);

  const ensureActive = useCallback(async () => {
    if (!session || session.status !== 'planned') return;
    await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active', started_at: new Date().toISOString() }),
    });
    setSession(prev => prev ? { ...prev, status: 'active' } : prev);
  }, [session, id]);

  const startRestTimer = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestTimer({ seconds, running: true });
    timerRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (prev.seconds <= 1) { clearInterval(timerRef.current!); return { seconds: 0, running: false }; }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const updateSet = async (setId: string, patch: Partial<SetLog>) => {
    await ensureActive();
    const res = await fetch('/api/sets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ set_id: setId, ...patch }),
    });
    const updated: SetLog = await res.json();
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map(ex => ({
          ...ex,
          sets_log: ex.sets_log.map(s => s.id === setId ? { ...s, ...updated } : s),
        })),
      };
    });
    if (patch.completed) {
      const ex = session?.exercises.find(e => e.sets_log.some(s => s.id === setId));
      if (ex) startRestTimer(ex.rest_seconds);
    }
  };

  const adjustWeight = (setId: string, current: number, delta: number) => {
    const next = Math.max(0, Math.round((current + delta) * 4) / 4);
    updateSet(setId, { weight_kg: next });
  };

  const finishSession = async () => {
    await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done', completed_at: new Date().toISOString() }),
    });
    setDone(true);
  };

  const allDone = session?.exercises.every(ex => ex.sets_log.every(s => s.completed));
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (!session) return null;
  if (done) return <SessionDone session={session} onBack={() => router.push('/')} />;

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 16px' }}>
        <button onClick={() => router.back()} className="btn-icon"><ArrowLeft size={18} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)', lineHeight: 1.2 }}>{session.session_name}</h1>
          <p style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2, fontWeight: 500 }}>
            {session.exercises.length} exercices · {session.estimated_duration} min
          </p>
        </div>
        {session.status === 'active' && (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--b-fg)', background: 'var(--b-bg)', padding: '5px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Play size={10} fill="var(--b-fg)" />En cours
          </span>
        )}
      </div>

      {/* Rest timer */}
      {restTimer.running && (
        <div className="animate-scale" style={{ margin: '0 20px', background: 'var(--b-bg)', border: '1.5px solid var(--b-fg)33', borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Timer size={20} color="var(--b-fg)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>Temps de repos</p>
          </div>
          <span style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--b-fg)' }}>
            {fmt(restTimer.seconds)}
          </span>
          <button onClick={() => setRestTimer({ seconds: 0, running: false })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
        </div>
      )}

      {/* Exercise cards */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {session.exercises.map((ex, idx) => {
          const completedSets = ex.sets_log.filter(s => s.completed).length;
          const isOpen = expandedIdx === idx;
          const isDone = completedSets === ex.sets;
          const color = muscleColor(ex.muscle_group);

          return (
            <div key={ex.id} style={{
              background: 'var(--card-bg)', border: isOpen ? `1.5px solid ${color}50` : 'var(--card-border)',
              borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--card-shadow)',
              transition: 'border-color 0.2s ease',
            }}>
              {/* Exercise image — centerpiece */}
              <div style={{ position: 'relative', height: isOpen ? 200 : 120, overflow: 'hidden', transition: 'height 0.3s ease', backgroundColor: `${color}10`, cursor: 'pointer' }}
                onClick={() => setExpandedIdx(isOpen ? -1 : idx)}
              >
                {ex.image_url ? (
                  <Image
                    src={ex.image_url}
                    alt={ex.name}
                    fill
                    style={{ objectFit: 'contain', padding: 8 }}
                    unoptimized
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                    <Dumbbell size={isOpen ? 48 : 32} color={color} style={{ opacity: 0.4 }} />
                  </div>
                )}

                {/* Overlay info */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(to top, rgba(255,255,255,0.95) 60%, transparent)',
                  padding: '20px 16px 12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div>
                      <span className="pill" style={{ background: `${color}20`, color, border: `1px solid ${color}40`, marginBottom: 4, display: 'inline-flex' }}>
                        {ex.muscle_group}
                      </span>
                      <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--green-deep)', lineHeight: 1.1 }}>{ex.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {ex.sets} × {ex.reps_target} · {ex.rest_seconds}s repos
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: isDone ? 'var(--green-ok)' : 'var(--text-muted)' }}>
                        {completedSets}/{ex.sets}
                      </span>
                      {isOpen ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                    </div>
                  </div>
                </div>

                {/* Done badge */}
                {isDone && (
                  <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--green-ok)', borderRadius: 20, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={12} color="white" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>Terminé</span>
                  </div>
                )}
              </div>

              {/* Sets — only when expanded */}
              {isOpen && (
                <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ex.notes && (
                    <div style={{ background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 10, padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      💡 {ex.notes}
                    </div>
                  )}
                  {ex.sets_log.map(s => (
                    <SetRow
                      key={s.id}
                      set={s}
                      repsTarget={ex.reps_target}
                      accentColor={color}
                      onToggle={() => updateSet(s.id, { completed: !s.completed })}
                      onWeightChange={delta => adjustWeight(s.id, s.weight_kg, delta)}
                      onRepsChange={reps => updateSet(s.id, { reps_done: reps })}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Finish */}
      {allDone && !done && (
        <div style={{ padding: '8px 20px 0' }}>
          <button onClick={finishSession} className="btn-orange animate-scale" style={{ width: '100%', height: 52, fontSize: 15 }}>
            <Trophy size={18} />Terminer la séance
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function SetRow({ set, repsTarget, accentColor, onToggle, onWeightChange, onRepsChange }: {
  set: SetLog; repsTarget: string; accentColor: string;
  onToggle: () => void; onWeightChange: (d: number) => void; onRepsChange: (r: number) => void;
}) {
  const defaultReps = parseInt(repsTarget.split('-')[0]) || 10;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '11px 12px', borderRadius: 14,
      background: set.completed ? `${accentColor}10` : 'var(--faint)',
      border: `1.5px solid ${set.completed ? accentColor + '40' : 'var(--line)'}`,
      transition: 'all 0.2s ease',
    }}>
      <button onClick={onToggle} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        {set.completed
          ? <CheckCircle size={22} color={accentColor} />
          : <Circle size={22} color="var(--sub)" />
        }
      </button>

      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sub)', width: 22, textAlign: 'center', flexShrink: 0 }}>
        S{set.set_number}
      </span>

      {/* Weight */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        <button className="btn-icon" style={{ width: 32, height: 32 }} onClick={() => onWeightChange(-2.5)}><Minus size={13} /></button>
        <div style={{ textAlign: 'center', minWidth: 52 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--ink)', lineHeight: 1 }}>{set.weight_kg}</div>
          <div style={{ fontSize: 10, color: 'var(--sub)', fontWeight: 600 }}>kg</div>
        </div>
        <button className="btn-icon" style={{ width: 32, height: 32 }} onClick={() => onWeightChange(2.5)}><Plus size={13} /></button>
      </div>

      {/* Reps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="btn-icon" style={{ width: 32, height: 32 }} onClick={() => onRepsChange(Math.max(1, (set.reps_done || defaultReps) - 1))}><Minus size={13} /></button>
        <div style={{ textAlign: 'center', minWidth: 38 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--ink)', lineHeight: 1 }}>{set.reps_done || defaultReps}</div>
          <div style={{ fontSize: 10, color: 'var(--sub)', fontWeight: 600 }}>reps</div>
        </div>
        <button className="btn-icon" style={{ width: 32, height: 32 }} onClick={() => onRepsChange((set.reps_done || defaultReps) + 1)}><Plus size={13} /></button>
      </div>
    </div>
  );
}

function SessionDone({ session, onBack }: { session: SessionWithExercises; onBack: () => void }) {
  const totalSets = session.exercises.reduce((a, ex) => a + ex.sets_log.filter(s => s.completed).length, 0);
  const totalVolume = session.exercises.reduce((a, ex) =>
    a + ex.sets_log.filter(s => s.completed).reduce((b, s) => b + s.weight_kg * s.reps_done, 0), 0);

  return (
    <div className="animate-scale" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '40px 20px' }}>
      <div style={{ width: 80, height: 80, borderRadius: 26, background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 12px 32px rgba(249,115,22,.38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Trophy size={36} color="white" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.4px' }}>Séance terminée 🎉</h1>
        <p style={{ fontSize: 14, color: 'var(--sub)', marginTop: 5, fontWeight: 500 }}>{session.session_name}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
        <div style={{ background: 'var(--card-bg)', borderRadius: 18, padding: '20px 16px', border: 'var(--card-border)', boxShadow: 'var(--card-shadow)', textAlign: 'center' }}>
          <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{totalSets}</p>
          <p style={{ fontSize: 12, color: 'var(--sub)', marginTop: 6, fontWeight: 600 }}>séries</p>
        </div>
        <div style={{ background: 'var(--card-bg)', borderRadius: 18, padding: '20px 16px', border: 'var(--card-border)', boxShadow: 'var(--card-shadow)', textAlign: 'center' }}>
          <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--b-fg)', lineHeight: 1 }}>{Math.round(totalVolume).toLocaleString()}</p>
          <p style={{ fontSize: 12, color: 'var(--sub)', marginTop: 6, fontWeight: 600 }}>kg soulevés</p>
        </div>
      </div>
      <button onClick={onBack} className="btn-primary" style={{ width: '100%', height: 52, fontSize: 15 }}>
        <Clock size={18} />Retour à l'accueil
      </button>
    </div>
  );
}
