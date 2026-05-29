'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Mail, Lock, User, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Mot de passe trop court (6 caractères min).'); return; }
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { display_name: form.name } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/');
    router.refresh();
  };

  const Field = ({ label, icon: Icon, ...props }: { label: string; icon: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <Icon size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input {...props} className="input" style={{ paddingLeft: 38 }} />
      </div>
    </div>
  );

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
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Crée ton compte</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Prénom" icon={User} type="text" required value={form.name} onChange={set('name')} placeholder="Thomas" />
        <Field label="Email" icon={Mail} type="email" required value={form.email} onChange={set('email')} placeholder="toi@exemple.com" />
        <Field label="Mot de passe" icon={Lock} type="password" required value={form.password} onChange={set('password')} placeholder="6 caractères min" />

        {error && <p className="pill pill-red" style={{ justifyContent: 'center' }}>{error}</p>}

        <button type="submit" className="btn-primary" style={{ marginTop: 8, width: '100%' }} disabled={loading}>
          {loading ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 13, marginTop: 24, color: 'var(--text-muted)' }}>
        Déjà un compte ?{' '}
        <Link href="/login" style={{ fontWeight: 700, color: 'var(--green-deep)', textDecoration: 'none' }}>Se connecter</Link>
      </p>
    </div>
  );
}
