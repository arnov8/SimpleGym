'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ChevronRight, Loader2, Dumbbell, Clock } from 'lucide-react';
import type { GeneratedWorkout } from '@/lib/types';

const QUICK_PROMPTS = [
  'Haut du corps — pecs, épaules, triceps',
  'Bas du corps — quadriceps et fessiers',
  'Dos et biceps complet',
  'Full body 45 minutes',
  'Épaules et bras isolés',
  'Jambes — ischio et mollets',
];

interface SessionResponse {
  session: { id: string; session_name: string; estimated_duration: number; exercises: { muscle_group: string }[] };
}

export default function GeneratePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<GeneratedWorkout | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const generate = async (text: string) => {
    if (!text.trim() || loading) return;
    setError(''); setLoading(true); setPreview(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const data: SessionResponse & { error?: string } = await res.json();
      if (data.error) { setError(data.error); return; }
      setPreview({
        session_name: data.session.session_name,
        estimated_duration: data.session.estimated_duration,
        muscles_targeted: [...new Set(data.session.exercises.map(e => e.muscle_group))],
        exercises: [],
      });
      setSessionId(data.session.id);
    } catch { setError('Erreur réseau. Réessaie.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Header */}
      <div style={{ padding: '24px 20px 20px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.4px' }}>Générer une séance</h1>
        <p style={{ fontSize: 13.5, color: 'var(--sub)', marginTop: 4, fontWeight: 500 }}>
          Décris ce que tu veux travailler, l'IA s'occupe du reste.
        </p>
      </div>

      {/* Prompt card */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ background: 'var(--card-bg)', borderRadius: 20, padding: '16px', border: 'var(--card-border)', boxShadow: 'var(--card-shadow)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); generate(prompt); } }}
            placeholder="Ex : Haut du corps, surtout les pectoraux et les épaules. Pas les trapèzes aujourd'hui."
            className="input"
            rows={4}
            style={{ resize: 'none', borderRadius: 14, fontSize: 14 }}
          />
          <button
            onClick={() => generate(prompt)}
            disabled={loading || !prompt.trim()}
            className="btn-primary"
            style={{ width: '100%', height: 48, fontSize: 15 }}
          >
            {loading ? <><Loader2 size={18} style={{ animation: 'spin .8s linear infinite' }} /> Génération en cours...</> : <><Sparkles size={18} /> Générer ma séance</>}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 14, padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: '#dc2626', textAlign: 'center' }}>
            {error}
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && sessionId && (
        <div style={{ padding: '16px 20px 0' }}>
          <div className="animate-scale" style={{ background: 'var(--primary)', borderRadius: 20, padding: '20px', boxShadow: '0 12px 28px -10px rgba(15,163,107,.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Sparkles size={14} color="rgba(255,255,255,.9)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.85)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Séance générée</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>{preview.session_name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <Clock size={13} color="rgba(255,255,255,.8)" />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>{preview.estimated_duration} min</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {preview.muscles_targeted.map(m => (
                <span key={m} style={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{m}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => sessionId && router.push(`/session/${sessionId}`)} className="btn-primary" style={{ flex: 1, background: '#fff', color: 'var(--primary)', boxShadow: 'none', height: 46 }}>
                Commencer maintenant →
              </button>
              <button onClick={() => { setPreview(null); setSessionId(null); setPrompt(''); }} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 12, padding: '0 16px', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', height: 46 }}>
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick prompts */}
      {!preview && !loading && (
        <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Suggestions rapides</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => { setPrompt(p); generate(p); }} style={{
                background: 'var(--card-bg)', border: 'var(--card-border)', boxShadow: 'var(--card-shadow)',
                borderRadius: 16, padding: '14px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                cursor: 'pointer', textAlign: 'left', transition: 'transform .15s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Dumbbell size={17} color="var(--primary)" />
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p}</span>
                </div>
                <ChevronRight size={16} color="var(--sub)" />
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
