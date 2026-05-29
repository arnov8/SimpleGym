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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--green-mid)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  if (!session) return null;
  if (done) return <SessionDone session={session} onBack={() => router.push('/')} />;

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} className="btn-icon"><ArrowLeft size={18} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontWeight: 800, fontSize: 17, color: 'var(--green-deep)', lineHeight: 1.2 }}>{session.session_name}</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {session.exercises.length} exercices · {session.estimated_duration} min
          </p>
        </div>
        {session.status === 'active' && (
          <span className="pill pill-orange" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Play size={10} />En cours
          </span>
        )}
      </div>

      {/* Rest timer */}
      {restTimer.running && (
        <div className="glass-orange animate-scale" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Timer size={20} color="var(--orange)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--green-deep)' }}>Temps de repos</p>
          </div>
          <span style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--orange)' }}>
            {fmt(restTimer.seconds)}
          </span>
          <button className="btn-icon" onClick={() => setRestTimer({ seconds: 0, running: false })} style={{ width: 28, height: 28 }}>✕</button>
        </div>
      )}

      {/* Exercise cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {session.exercises.map((ex, idx) => {
          const completedSets = ex.sets_log.filter(s => s.completed).length;
          const isOpen = expandedIdx === idx;
          const isDone = completedSets === ex.sets;
          const color = muscleColor(ex.muscle_group);

          return (
            <div key={ex.id} className="glass-strong" style={{
              overflow: 'hidden',
              outline: isOpen ? `2px solid ${color}33` : '2px solid transparent',
              transition: 'outline 0.2s ease',
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
        <button onClick={finishSession} className="btn-orange animate-scale" style={{ width: '100%' }}>
          <Trophy size={18} />Terminer la séance
        </button>
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
      padding: '10px 12px', borderRadius: 12,
      background: set.completed ? `${accentColor}0d` : 'rgba(255,255,255,0.5)',
      border: `1px solid ${set.completed ? accentColor + '30' : 'rgba(255,255,255,0.85)'}`,
      transition: 'all 0.2s ease',
    }}>
      <button onClick={onToggle} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        {set.completed
          ? <CheckCircle size={22} color={accentColor} />
          : <Circle size={22} color="var(--text-muted)" />
        }
      </button>

      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', width: 24, textAlign: 'center', flexShrink: 0 }}>
        S{set.set_number}
      </span>

      {/* Weight */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        <button className="btn-icon" style={{ width: 30, height: 30 }} onClick={() => onWeightChange(-2.5)}><Minus size={12} /></button>
        <div style={{ textAlign: 'center', minWidth: 50 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--green-deep)', lineHeight: 1 }}>{set.weight_kg}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>kg</div>
        </div>
        <button className="btn-icon" style={{ width: 30, height: 30 }} onClick={() => onWeightChange(2.5)}><Plus size={12} /></button>
      </div>

      {/* Reps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="btn-icon" style={{ width: 30, height: 30 }} onClick={() => onRepsChange(Math.max(1, (set.reps_done || defaultReps) - 1))}><Minus size={12} /></button>
        <div style={{ textAlign: 'center', minWidth: 36 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--green-deep)', lineHeight: 1 }}>{set.reps_done || defaultReps}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>reps</div>
        </div>
        <button className="btn-icon" style={{ width: 30, height: 30 }} onClick={() => onRepsChange((set.reps_done || defaultReps) + 1)}><Plus size={12} /></button>
      </div>
    </div>
  );
}

function SessionDone({ session, onBack }: { session: SessionWithExercises; onBack: () => void }) {
  const totalSets = session.exercises.reduce((a, ex) => a + ex.sets_log.filter(s => s.completed).length, 0);
  const totalVolume = session.exercises.reduce((a, ex) =>
    a + ex.sets_log.filter(s => s.completed).reduce((b, s) => b + s.weight_kg * s.reps_done, 0), 0);

  return (
    <div className="animate-scale" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '32px 0' }}>
      <div style={{
        width: 80, height: 80, borderRadius: 28,
        background: 'linear-gradient(135deg,#f97316,#ea580c)',
        boxShadow: '0 8px 32px rgba(249,115,22,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Trophy size={36} color="white" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--green-deep)' }}>Séance terminée 🎉</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{session.session_name}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
        <div className="glass" style={{ padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--green-mid)' }}>{totalSets}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>séries complétées</p>
        </div>
        <div className="glass" style={{ padding: '20px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--orange)' }}>{Math.round(totalVolume).toLocaleString()}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>kg de volume</p>
        </div>
      </div>
      <button onClick={onBack} className="btn-primary" style={{ width: '100%' }}>
        <Clock size={18} />Retour au tableau de bord
      </button>
    </div>
  );
}
