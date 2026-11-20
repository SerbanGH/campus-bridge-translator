import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { POLL_OPTIONS, pollPercentages, type PollOptionId } from "@/lib/copilot/poll";
import { pollResultsQuery, submitVote } from "@/lib/copilot/shared";
import { useLocalStorage } from "@/lib/copilot/use-local-storage";
import { SectionHeading } from "./section-heading";

const EMOJI: Record<PollOptionId, string> = {
  materials: "🇷🇴",
  courses: "🗓️",
  bureaucracy: "🏛️",
  dorm: "🛏️",
};

export function Poll() {
  const qc = useQueryClient();
  const { data: counts } = useQuery(pollResultsQuery);
  const [myVote, setMyVote] = useLocalStorage<PollOptionId | null>("upt-poll-vote", null);
  const vote = useMutation({
    mutationFn: submitVote,
    onSuccess: (_d, option) => {
      setMyVote(option);
      qc.setQueryData(pollResultsQuery.queryKey, (c) => ({
        ...c,
        [option]: (c?.[option] ?? 0) + 1,
      }));
      qc.invalidateQueries({ queryKey: pollResultsQuery.queryKey });
    },
    onError: () => toast.error("Couldn't record the vote — try again."),
  });
  const { total, rows } = pollPercentages(counts ?? {});
  const max = Math.max(...rows.map((r) => r.votes), 0);

  return (
    <section id="poll" className="bg-navy py-14 text-navy-foreground sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Live student poll"
          title="Which UPT headache hit you hardest?"
          onDark
        >
          One tap. Results update live across every phone.
        </SectionHeading>

        {!myVote ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {POLL_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                disabled={vote.isPending}
                onClick={() => vote.mutate(o.id)}
                className="flex items-center gap-4 rounded-2xl border border-navy-border bg-navy-foreground/5 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/20 disabled:opacity-60"
              >
                <span className="text-3xl">{EMOJI[o.id]}</span>
                <span className="font-display text-base font-semibold sm:text-lg">{o.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-card p-5 text-card-foreground shadow-card sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="size-4 text-primary" /> {total} response
                {total === 1 ? "" : "s"}
              </p>
              <Button type="button" size="sm" variant="soft" onClick={() => setMyVote(null)}>
                <RotateCcw /> Record another student
              </Button>
            </div>
            <ul className="space-y-4">
              {rows.map((r) => (
                <li key={r.id}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      {EMOJI[r.id]} {r.label}
                      {r.id === myVote && <Check className="size-4 text-success" />}
                    </span>
                    <span className="font-mono font-bold">{r.pct}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`animate-grow-x h-full rounded-full ${r.votes === max && max > 0 ? "bg-success" : "bg-primary"}`}
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
