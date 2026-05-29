export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale">{children}</div>
    </div>
  );
}
