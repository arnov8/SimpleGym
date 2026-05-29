'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, LogOut, Loader2, User, Dumbbell, SlidersHorizontal, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

const LEVELS = [
  { value: 'beginner',     label: 'Débutant',       desc: 'Moins d\'1 an de pratique' },
  { value: 'intermediate', label: 'Intermédiaire',   desc: '1 à 3 ans de pratique'    },
  { value: 'advanced',     label: 'Avancé',          desc: 'Plus de 3 ans de pratique' },
];

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={15} color="var(--primary)" />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{label}</span>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<(Profile & { email?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ display_name: '', fitness_level: 'intermediate', equipment_notes: '' });

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data => {
      setProfile(data);
      setForm({ display_name: data.display_name, fitness_level: data.fitness_level, equipment_notes: data.equipment_notes });
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  const logout = async () => {
    await createClient().auth.signOut();
    router.push('/login');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Header */}
      <div style={{ padding: '24px 20px 20px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.4px' }}>Réglages</h1>
        <p style={{ fontSize: 13.5, color: 'var(--sub)', marginTop: 4, fontWeight: 500 }}>{profile?.email}</p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Identity */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 20, padding: '18px', border: 'var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <SectionTitle icon={User} label="Identité" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--sub)' }}>Prénom / surnom</label>
            <input
              type="text" className="input" value={form.display_name}
              onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
              placeholder="Thomas"
            />
          </div>
        </div>

        {/* Fitness level */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 20, padding: '18px', border: 'var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <SectionTitle icon={Dumbbell} label="Niveau" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LEVELS.map(l => {
              const active = form.fitness_level === l.value;
              return (
                <button key={l.value} onClick={() => setForm(p => ({ ...p, fitness_level: l.value }))} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 14px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                  background: active ? 'var(--primary-soft)' : 'var(--faint)',
                  border: active ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                  transition: 'all .15s ease',
                }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: active ? 'var(--primary)' : 'var(--ink)' }}>{l.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--sub)', marginTop: 2 }}>{l.desc}</p>
                  </div>
                  {active && <Check size={16} color="var(--primary)" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Equipment */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 20, padding: '18px', border: 'var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <SectionTitle icon={SlidersHorizontal} label="Équipement & préférences" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--sub)', lineHeight: 1.4 }}>
              Décris ton équipement et tes contraintes — transmis à l'IA à chaque génération
            </label>
            <textarea
              className="input" rows={4} value={form.equipment_notes}
              onChange={e => setForm(p => ({ ...p, equipment_notes: e.target.value }))}
              placeholder="Ex : Salle équipée standard. Douleur au genou gauche, éviter les leg press lourds."
              style={{ resize: 'none', borderRadius: 14, fontSize: 14 }}
            />
          </div>
        </div>

        {/* Save */}
        <button onClick={save} disabled={saving} className={saved ? 'btn-ghost' : 'btn-primary'} style={{ width: '100%', height: 50, fontSize: 15 }}>
          {saving ? <><Loader2 size={18} style={{ animation: 'spin .8s linear infinite' }} /> Enregistrement...</> : saved ? <>✓ Enregistré</> : <><Save size={18} /> Enregistrer</>}
        </button>

        {/* Danger zone */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 20, padding: '4px', border: 'var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '14px', borderRadius: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#dc2626', fontSize: 14, fontWeight: 700,
          }}>
            <LogOut size={17} /> Se déconnecter
          </button>
        </div>

        <div style={{ height: 8 }} />
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
