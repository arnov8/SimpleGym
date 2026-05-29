'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, LogOut, Loader2, User, Dumbbell, SlidersHorizontal } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

const LEVELS = [
  { value: 'beginner',     label: 'Débutant',      desc: 'Moins d\'1 an de pratique' },
  { value: 'intermediate', label: 'Intermédiaire',  desc: '1 à 3 ans de pratique'    },
  { value: 'advanced',     label: 'Avancé',         desc: 'Plus de 3 ans de pratique' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<(Profile & { email?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ display_name: '', fitness_level: 'intermediate', equipment_notes: '' });

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setProfile(data);
        setForm({ display_name: data.display_name, fitness_level: data.fitness_level, equipment_notes: data.equipment_notes });
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--indigo)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Réglages</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{profile?.email}</p>
      </div>

      {/* Identity */}
      <section className="glass-strong p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <User size={16} style={{ color: 'var(--indigo-light)' }} />
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Identité</h2>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Prénom / surnom</label>
          <input
            type="text"
            className="input"
            value={form.display_name}
            onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
            placeholder="Thomas"
          />
        </div>
      </section>

      {/* Fitness level */}
      <section className="glass-strong p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <Dumbbell size={16} style={{ color: 'var(--indigo-light)' }} />
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Niveau</h2>
        </div>
        <div className="flex flex-col gap-2">
          {LEVELS.map(l => (
            <button
              key={l.value}
              onClick={() => setForm(p => ({ ...p, fitness_level: l.value }))}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: form.fitness_level === l.value ? 'rgba(99,102,241,0.15)' : 'var(--glass-bg)',
                border: `1px solid ${form.fitness_level === l.value ? 'rgba(99,102,241,0.4)' : 'var(--glass-border)'}`,
              }}
            >
              <p className="font-semibold text-sm" style={{ color: form.fitness_level === l.value ? 'var(--indigo-light)' : 'var(--text-primary)' }}>
                {l.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{l.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Equipment */}
      <section className="glass-strong p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal size={16} style={{ color: 'var(--indigo-light)' }} />
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Équipement & préférences</h2>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Décris ton équipement et tes contraintes (transmis à l'IA à chaque génération)
          </label>
          <textarea
            className="input resize-none"
            rows={4}
            value={form.equipment_notes}
            onChange={e => setForm(p => ({ ...p, equipment_notes: e.target.value }))}
            placeholder="Ex : Salle équipée standard. J'ai une douleur au genou gauche, éviter les leg press lourds. Pas de machine à câbles basse."
            style={{ borderRadius: 12 }}
          />
        </div>
      </section>

      {/* Save */}
      <button onClick={save} disabled={saving} className={saved ? 'btn-ghost w-full' : 'btn-primary w-full'}>
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {saving ? 'Enregistrement...' : saved ? '✓ Enregistré' : 'Enregistrer'}
      </button>

      <div className="divider" />

      <button onClick={logout} className="btn-ghost w-full text-sm" style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}>
        <LogOut size={16} />
        Déconnexion
      </button>
    </div>
  );
}
