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
    <div className="min-h-dvh">
      <Navigation displayName={displayName} />
      <main className="md:ml-64 pb-24 md:pb-8 pt-safe">
        <div className="max-w-2xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
