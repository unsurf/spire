export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">
            Spire
          </h1>
          <p className="text-muted mt-1 text-sm">Your personal financial layer</p>
        </div>
        {children}
      </div>
    </div>
  );
}
