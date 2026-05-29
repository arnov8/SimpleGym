'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronDown, ChevronUp, CheckCircle, Circle, Minus, Plus,
  Clock, Play, Trophy, ArrowLeft, Timer
} from 'lucide-react';
import type { Session, Exercise, SetLog } from '@/lib/types';

interface ExerciseWithSets extends Exercise {
  sets_log: SetLog[];
}
interface SessionWithExercises extends Session {
  exercises: ExerciseWithSets[];
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionWithExercises | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState(0);
  const [restTimer, setRestTimer] = useState<{ seconds: number; running: boolean }>({ seconds: 0, running: false });
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

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Start session when first interaction
  const ensureActive = useCallback(async () => {
    if (!session || session.status !== 'planned') return;
    await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active', started_at: new Date().toISOString() }),
    });
    setSession(prev => prev ? { ...prev, status: 'active', started_at: new Date().toISOString() } : prev);
  }, [session, id]);

  // Rest timer logic
  const startRestTimer = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRestTimer({ seconds, running: true });
    timerRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (prev.seconds <= 1) {
          clearInterval(timerRef.current!);
          return { seconds: 0, running: false };
        }
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

  const adjustWeight = (setId: string, currentWeight: number, delta: number) => {
    const newWeight = Math.max(0, Math.round((currentWeight + delta) * 4) / 4);
    updateSet(setId, { weight_kg: newWeight });
  };

  const finishSession = async () => {
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done', completed_at: new Date().toISOString() }),
    });
    if (res.ok) setDone(true);
  };

  const allDone = session?.exercises.every(ex =>
    ex.sets_log.every(s => s.completed)
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--indigo)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!session) return null;

  if (done) return <SessionDone session={session} onBack={() => router.push('/')} />;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex flex-col gap-4 animate-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-icon">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>{session.session_name}</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {session.exercises.length} exercices · {session.estimated_duration} min
          </p>
        </div>
        {session.status === 'active' && (
          <span className="pill pill-orange flex items-center gap-1"><Play size={10} />En cours</span>
        )}
      </div>

      {/* Rest timer */}
      {restTimer.running && (
        <div className="glass-orange p-3 flex items-center gap-3 animate-scale">
          <Timer size={20} style={{ color: 'var(--orange)' }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Repos</p>
          </div>
          <span className="text-2xl font-bold font-mono" style={{ color: 'var(--orange)' }}>
            {formatTime(restTimer.seconds)}
          </span>
          <button className="btn-icon" onClick={() => setRestTimer({ seconds: 0, running: false })}>
            ✕
          </button>
        </div>
      )}

      {/* Exercises */}
      <div className="flex flex-col gap-3">
        {session.exercises.map((ex, idx) => {
          const completedSets = ex.sets_log.filter(s => s.completed).length;
          const isOpen = expandedIdx === idx;

          return (
            <div key={ex.id} className={`glass-strong overflow-hidden transition-all ${idx === expandedIdx ? 'ring-1 ring-indigo-500/30' : ''}`}>
              {/* Exercise header */}
              <button
                className="w-full p-4 flex items-center gap-3 text-left"
                onClick={() => setExpandedIdx(isOpen ? -1 : idx)}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background: completedSets === ex.sets ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.15)',
                    color: completedSets === ex.sets ? '#4ade80' : 'var(--indigo-light)',
                  }}
                >
                  {completedSets === ex.sets ? '✓' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{ex.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {ex.sets} × {ex.reps_target} · Repos {ex.rest_seconds}s
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: completedSets === ex.sets ? '#4ade80' : 'var(--text-muted)' }}>
                    {completedSets}/{ex.sets}
                  </span>
                  {isOpen ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                </div>
              </button>

              {/* Sets */}
              {isOpen && (
                <div className="px-4 pb-4 flex flex-col gap-2">
                  {ex.notes && (
                    <p className="text-xs px-3 py-2 rounded-lg mb-1" style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--text-secondary)' }}>
                      💡 {ex.notes}
                    </p>
                  )}
                  {ex.sets_log.map(s => (
                    <SetRow
                      key={s.id}
                      set={s}
                      repsTarget={ex.reps_target}
                      onToggle={() => updateSet(s.id, { completed: !s.completed })}
                      onWeightChange={(delta) => adjustWeight(s.id, s.weight_kg, delta)}
                      onRepsChange={(reps) => updateSet(s.id, { reps_done: reps })}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Finish button */}
      {allDone && !done && (
        <button onClick={finishSession} className="btn-orange w-full animate-scale">
          <Trophy size={18} />
          Terminer la séance
        </button>
      )}
    </div>
  );
}

function SetRow({
  set, repsTarget, onToggle, onWeightChange, onRepsChange,
}: {
  set: SetLog;
  repsTarget: string;
  onToggle: () => void;
  onWeightChange: (delta: number) => void;
  onRepsChange: (reps: number) => void;
}) {
  const defaultReps = parseInt(repsTarget.split('-')[0]) || 10;

  return (
    <div
      className="p-3 rounded-xl flex items-center gap-3 transition-all"
      style={{
        background: set.completed ? 'rgba(34,197,94,0.08)' : 'var(--glass-bg)',
        border: `1px solid ${set.completed ? 'rgba(34,197,94,0.2)' : 'var(--glass-border)'}`,
      }}
    >
      <button onClick={onToggle} className="flex-shrink-0">
        {set.completed
          ? <CheckCircle size={22} style={{ color: '#4ade80' }} />
          : <Circle size={22} style={{ color: 'var(--text-muted)' }} />
        }
      </button>

      <span className="text-xs font-semibold w-6 text-center flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
        S{set.set_number}
      </span>

      {/* Weight */}
      <div className="flex items-center gap-1 flex-1">
        <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => onWeightChange(-2.5)}>
          <Minus size={12} />
        </button>
        <div className="flex flex-col items-center min-w-[52px]">
          <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{set.weight_kg}</span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>kg</span>
        </div>
        <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => onWeightChange(2.5)}>
          <Plus size={12} />
        </button>
      </div>

      {/* Reps */}
      <div className="flex items-center gap-1">
        <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => onRepsChange(Math.max(1, (set.reps_done || defaultReps) - 1))}>
          <Minus size={12} />
        </button>
        <div className="flex flex-col items-center min-w-[40px]">
          <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{set.reps_done || defaultReps}</span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>reps</span>
        </div>
        <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => onRepsChange((set.reps_done || defaultReps) + 1)}>
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

function SessionDone({ session, onBack }: { session: SessionWithExercises; onBack: () => void }) {
  const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets_log.filter(s => s.completed).length, 0);
  const totalVolume = session.exercises.reduce((acc, ex) =>
    acc + ex.sets_log.filter(s => s.completed).reduce((a, s) => a + s.weight_kg * s.reps_done, 0), 0
  );

  return (
    <div className="flex flex-col items-center gap-6 py-8 animate-scale">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 0 40px rgba(249,115,22,0.4)' }}
      >
        <Trophy size={36} color="white" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Séance terminée 🎉</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{session.session_name}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="glass p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--indigo-light)' }}>{totalSets}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>séries complétées</p>
        </div>
        <div className="glass p-4 text-center">
          <p className="text-2xl font-bold" style={{ color: 'var(--orange)' }}>{Math.round(totalVolume).toLocaleString()}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>kg de volume total</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <button onClick={onBack} className="btn-primary w-full">
          <Clock size={18} />
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
}
