import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navigation from '@/components/Navigation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Athlète';

  return (
    <div className="app-shell">
      <Navigation displayName={displayName} />
      <main className="app-main">
        <div style={{ maxWidth: 540, margin: '0 auto', width: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
