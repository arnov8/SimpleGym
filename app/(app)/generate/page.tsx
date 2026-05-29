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
    setError('');
    setLoading(true);
    setPreview(null);

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
    } catch {
      setError('Erreur réseau. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate(prompt);
  };

  const startSession = () => {
    if (sessionId) router.push(`/session/${sessionId}`);
  };

  return (
    <div className="flex flex-col gap-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Générer une séance</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Décris ce que tu veux travailler, l'IA s'occupe du reste.
        </p>
      </div>

      {/* Prompt input */}
      <form onSubmit={handleSubmit} className="glass-strong p-4 flex flex-col gap-3">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ex : Je veux travailler le haut du corps, surtout les pectoraux et les épaules. Pas d'exercice pour les trapèzes aujourd'hui."
          className="input resize-none"
          rows={4}
          style={{ borderRadius: 12 }}
        />
        <button
          type="submit"
          className="btn-primary self-end"
          disabled={loading || !prompt.trim()}
        >
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Génération...</>
            : <><Sparkles size={18} /> Générer</>
          }
        </button>
      </form>

      {error && <p className="pill pill-red justify-center">{error}</p>}

      {/* Quick prompts */}
      {!preview && !loading && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Suggestions rapides
          </p>
          <div className="flex flex-col gap-2">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => { setPrompt(p); generate(p); }}
                className="glass p-3.5 flex items-center justify-between hover-lift text-left"
              >
                <div className="flex items-center gap-3">
                  <Dumbbell size={16} style={{ color: 'var(--indigo-light)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{p}</span>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Preview */}
      {preview && sessionId && (
        <div className="glass-strong p-5 flex flex-col gap-4 animate-scale">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} style={{ color: 'var(--indigo-light)' }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--indigo-light)' }}>
                Séance générée
              </span>
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{preview.session_name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{preview.estimated_duration} min</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {preview.muscles_targeted.map(m => (
              <span key={m} className="pill pill-indigo">{m}</span>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={startSession} className="btn-orange flex-1">
              <ChevronRight size={18} />
              Commencer maintenant
            </button>
            <button onClick={() => { setPreview(null); setSessionId(null); setPrompt(''); }} className="btn-ghost">
              Modifier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
