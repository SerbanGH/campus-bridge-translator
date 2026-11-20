export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display font-bold text-foreground">
          Erasmus Copilot <span className="text-primary">UPT</span>
        </p>
        <p>
          Built at AI Prototyping Bootcamp • Politehnica University of Timișoara (20–22 Nov 2026)
        </p>
      </div>
    </footer>
  );
}
