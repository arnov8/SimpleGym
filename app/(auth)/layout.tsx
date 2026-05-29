export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--screen-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      paddingTop: 'max(24px, env(safe-area-inset-top))',
      paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }} className="animate-scale">
        {children}
      </div>
    </div>
  );
}
