'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Dumbbell } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface ExerciseStat {
  exercise_name: string;
  dataPoints: { date: string; max_weight: number; total_volume: number }[];
}

export default function ProgressPage() {
  const [stats, setStats] = useState<ExerciseStat[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('sets_log')
        .select(`
          weight_kg, reps_done, completed,
          exercises!inner(name, session_id,
            sessions!inner(profile_id, date, status)
          )
        `)
        .eq('exercises.sessions.profile_id', user.id)
        .eq('exercises.sessions.status', 'done')
        .eq('completed', true);

      if (!data) { setLoading(false); return; }

      const map: Record<string, Record<string, { max: number; volume: number }>> = {};
      for (const row of data as unknown as {
        weight_kg: number; reps_done: number;
        exercises: { name: string; sessions: { date: string } };
      }[]) {
        const name = row.exercises.name;
        const date = row.exercises.sessions.date;
        if (!map[name]) map[name] = {};
        if (!map[name][date]) map[name][date] = { max: 0, volume: 0 };
        map[name][date].max = Math.max(map[name][date].max, row.weight_kg);
        map[name][date].volume += row.weight_kg * row.reps_done;
      }

      const result: ExerciseStat[] = Object.entries(map)
        .filter(([, dates]) => Object.keys(dates).length >= 2)
        .map(([name, dates]) => ({
          exercise_name: name,
          dataPoints: Object.entries(dates)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, v]) => ({
              date: format(new Date(date + 'T12:00:00'), 'd MMM', { locale: fr }),
              max_weight: v.max,
              total_volume: Math.round(v.volume),
            })),
        }))
        .sort((a, b) => b.dataPoints.length - a.dataPoints.length);

      setStats(result);
      if (result.length > 0) setSelected(result[0].exercise_name);
      setLoading(false);
    };
    load();
  }, []);

  const current = stats.find(s => s.exercise_name === selected);

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--indigo)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Progression</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Évolution de tes charges par exercice
        </p>
      </div>

      {stats.length === 0 ? (
        <div className="glass p-8 flex flex-col items-center gap-3 text-center">
          <TrendingUp size={32} style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Complète au moins 2 séances pour voir ta progression.</p>
          <Link href="/generate" className="btn-primary">
            <Dumbbell size={18} />
            Générer une séance
          </Link>
        </div>
      ) : (
        <>
          {/* Exercise selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {stats.map(s => (
              <button
                key={s.exercise_name}
                onClick={() => setSelected(s.exercise_name)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: selected === s.exercise_name ? 'rgba(99,102,241,0.2)' : 'var(--glass-bg)',
                  color: selected === s.exercise_name ? 'var(--indigo-light)' : 'var(--text-muted)',
                  border: `1px solid ${selected === s.exercise_name ? 'rgba(99,102,241,0.4)' : 'var(--glass-border)'}`,
                }}
              >
                {s.exercise_name}
              </button>
            ))}
          </div>

          {/* Chart */}
          {current && (
            <div className="glass-strong p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>{current.exercise_name}</h2>
                <span className="pill pill-indigo">{current.dataPoints.length} séances</span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                  Charge max (kg)
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={current.dataPoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <Line
                      type="monotone" dataKey="max_weight" stroke="#6366f1"
                      strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="divider" />

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                  Volume total (kg)
                </p>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={current.dataPoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#94a3b8' }}
                      itemStyle={{ color: '#f97316' }}
                    />
                    <Line
                      type="monotone" dataKey="total_volume" stroke="#f97316"
                      strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
