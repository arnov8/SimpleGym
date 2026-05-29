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
    if (error) {
      setError(error.message);
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
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Crée ton compte</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Prénom</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="text" required value={form.name} onChange={set('name')} placeholder="Thomas" className="input pl-10" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="email" required value={form.email} onChange={set('email')} placeholder="toi@exemple.com" className="input pl-10" />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Mot de passe</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="password" required value={form.password} onChange={set('password')} placeholder="6 caractères min" className="input pl-10" />
          </div>
        </div>

        {error && <p className="text-sm pill pill-red w-full justify-center">{error}</p>}

        <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
        Déjà un compte ?{' '}
        <Link href="/login" className="font-semibold" style={{ color: 'var(--indigo-light)' }}>
          Se connecter
        </Link>
      </p>
    </div>
  );
}
