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
    <div className="glass-strong" style={{ padding: 36 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 18,
          background: 'linear-gradient(135deg, #10b981, #0d5e3a)',
          boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
        }}>
          <Dumbbell size={26} color="white" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--green-deep)', letterSpacing: '-0.4px' }}>SimpleGym</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Connexion à ton espace</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="toi@exemple.com" className="input" style={{ paddingLeft: 38 }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Mot de passe
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input" style={{ paddingLeft: 38 }} />
          </div>
        </div>

        {error && (
          <p className="pill pill-red" style={{ justifyContent: 'center' }}>{error}</p>
        )}

        <button type="submit" className="btn-primary" style={{ marginTop: 8, width: '100%' }} disabled={loading}>
          {loading ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, marginTop: 24, color: 'var(--text-muted)' }}>
        Pas encore de compte ?{' '}
        <Link href="/register" style={{ fontWeight: 700, color: 'var(--green-deep)', textDecoration: 'none' }}>
          S'inscrire
        </Link>
      </p>
    </div>
  );
}
