const LINKS = [
  { href: "#beta", label: "Early access" },
  { href: "#workspace", label: "AI workspace" },
  { href: "#poll", label: "Poll" },
  { href: "#why", label: "Why us" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy-border bg-navy/90 text-navy-foreground backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-2 font-display text-base font-bold"
        >
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-primary text-xs">
            EC
          </span>
          <span>
            <span className="hidden min-[420px]:inline">Erasmus </span>Copilot{" "}
            <span className="text-success">UPT</span>
          </span>
        </a>
        <nav className="hidden flex-1 justify-end gap-1 sm:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-navy-muted transition-colors hover:bg-navy-foreground/10 hover:text-navy-foreground sm:text-sm"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a
          href="#beta"
          className="ml-auto rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground sm:hidden"
        >
          Join beta
        </a>
      </div>
    </header>
  );
}
