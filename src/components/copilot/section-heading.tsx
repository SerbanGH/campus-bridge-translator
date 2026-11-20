import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  children,
  onDark = false,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  onDark?: boolean;
}) {
  return (
    <div className="mb-6 max-w-2xl">
      <p
        className={`mb-2 font-mono text-xs font-medium uppercase tracking-widest ${onDark ? "text-success" : "text-primary"}`}
      >
        {eyebrow}
      </p>
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      {children && (
        <p className={`mt-2 ${onDark ? "text-navy-muted" : "text-muted-foreground"}`}>{children}</p>
      )}
    </div>
  );
}
