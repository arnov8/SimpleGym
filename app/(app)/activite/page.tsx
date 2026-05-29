'use client';

import { useEffect, useState } from 'react';
import { Dumbbell, Activity, Flame, ChevronUp, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format, addDays, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DayStats {
  volume: number;
  duration: number;
  calories: number;
}

export default function ActivitePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState<DayStats>({ volume: 0, duration: 0, calories: 0 });
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const dateStr = selectedDate.toISOString().split('T')[0];

      const { data: session } = await supabase
        .from('sessions')
        .select('id, started_at, completed_at, estimated_duration')
        .eq('date', dateStr)
        .eq('status', 'done')
        .limit(1)
        .single();

      let volume = 0;
      let duration = 0;
      let calories = 0;

      if (session) {
        const { data: sets } = await supabase
          .from('sets_log')
          .select('weight_kg, reps_done')
          .eq('session_id', session.id)
          .eq('completed', true);

        volume = (sets ?? []).reduce((a, s) => a + s.weight_kg * s.reps_done, 0);
        duration = session.started_at && session.completed_at
          ? Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 60000)
          : session.estimated_duration ?? 0;
        calories = Math.round(volume * 0.08);
      }

      setStats({ volume: Math.round(volume), duration, calories });
      setLoading(false);
    };
    load();
  }, [selectedDate]);

  const rows = [
    { icon: Dumbbell, label: 'Volume soulevé', val: stats.volume.toLocaleString(), unit: 'kg', time: format(selectedDate, 'EEE HH:mm', { locale: fr }), fg: 'var(--a-fg)', bg: 'var(--a-bg)' },
    { icon: Activity, label: 'Durée séance', val: stats.duration.toString(), unit: 'min', time: format(selectedDate, 'EEE', { locale: fr }), fg: 'var(--b-fg)', bg: 'var(--b-bg)' },
    { icon: Flame, label: 'Calories estimées', val: stats.calories.toString(), unit: 'kcal', time: format(selectedDate, 'EEE', { locale: fr }), fg: 'var(--d-fg)', bg: 'var(--d-bg)' },
  ];

  const dateLabel = format(selectedDate, 'EEEE d', { locale: fr });

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 6px' }}>
        <div style={{ width: 34, height: 34, borderRadius: 12, background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px -4px rgba(20,60,40,.25)', border: 'var(--card-border)' }}>
          <Activity size={16} color="var(--ink)" />
        </div>
        <button onClick={() => {}} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--ink)', textTransform: 'capitalize' }}>{dateLabel}</span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 0.7, color: 'var(--sub)' }}>
            <ChevronUp size={13} strokeWidth={2.4} />
            <ChevronDown size={13} strokeWidth={2.4} />
          </div>
        </button>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(140deg,#0fa36b,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>A</div>
      </div>

      {/* Day strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 16px 6px', gap: 4 }}>
        {days.map((d, i) => {
          const isSelected = d.toDateString() === selectedDate.toDateString();
          return (
            <button key={i} onClick={() => setSelectedDate(d)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '9px 0', width: 38, borderRadius: 20, border: 'none', cursor: 'pointer',
              background: isSelected ? 'var(--primary)' : 'transparent',
              transition: 'background 0.2s ease',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: isSelected ? 'rgba(255,255,255,.85)' : 'var(--sub)', textTransform: 'uppercase' }}>
                {format(d, 'EEE', { locale: fr })[0]}
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: isSelected ? '#fff' : 'var(--ink)' }}>
                {format(d, 'd')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Activity rows */}
      <div style={{ padding: '16px 18px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : rows.map(r => (
          <div key={r.label} style={{
            background: 'var(--card-bg)', borderRadius: 18, padding: '15px 15px',
            boxShadow: 'var(--card-shadow)', border: 'var(--card-border)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <r.icon size={23} color={r.fg} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--ink)' }}>{r.val}</span>
                <span style={{ fontSize: 11.5, color: 'var(--sub)', fontWeight: 600 }}>{r.unit}</span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, marginTop: 2, color: 'var(--ink)' }}>{r.label}</p>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: r.fg, background: r.bg, padding: '5px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
              {r.time}
            </span>
          </div>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
