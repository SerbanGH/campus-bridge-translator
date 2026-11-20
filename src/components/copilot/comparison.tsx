import { Check, X } from "lucide-react";
import { SectionHeading } from "./section-heading";

const ROWS = [
  ["Static PDF of course lists", "Live schedule clash checks across UPT faculties"],
  ["“Use Google Translate” advice", "Romanian → English lab & Virtual Campus translation"],
  ["“Visit a doctor” generic tip", "Polyclinic doctor & hours matched to your faculty"],
  ["Office addresses, no hours", "Real-time office windows (Rectorate 107, IGI Tuesdays)"],
  ["Same checklist for every country", "EU vs Non-EU / Turkish permit paths"],
];

export function Comparison() {
  return (
    <section id="why" className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
      <SectionHeading
        eyebrow="Why we're different"
        title="Generic EU apps tell you what. We tell you where, when and who — at UPT."
      />
      <div className="grid overflow-hidden rounded-2xl border bg-card shadow-card sm:grid-cols-2">
        <div className="border-b bg-muted/60 p-5 sm:border-b-0 sm:border-r">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Generic EU Apps & Static PDFs
          </h3>
          <ul className="space-y-3">
            {ROWS.map(([a]) => (
              <li key={a} className="flex gap-2 text-sm text-muted-foreground">
                <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                {a}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-primary">
            Erasmus Copilot UPT
          </h3>
          <ul className="space-y-3">
            {ROWS.map(([, b]) => (
              <li key={b} className="flex gap-2 text-sm font-medium">
                <Check className="mt-0.5 size-4 shrink-0 text-success" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
