'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Mail, Lock, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
      return;
    }
    router.push('/');
    router.refresh();
  };

  return (
    <div className="glass-strong p-8">
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}
        >
          <Dumbbell size={28} color="white" />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>SimpleGym</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Connexion à ton espace</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Email
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
              className="input pl-10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Mot de passe
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input pl-10"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm pill pill-red w-full justify-center">{error}</p>
        )}

        <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
        Pas encore de compte ?{' '}
        <Link href="/register" className="font-semibold" style={{ color: 'var(--indigo-light)' }}>
          S'inscrire
        </Link>
      </p>
    </div>
  );
}
