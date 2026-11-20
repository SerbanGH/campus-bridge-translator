import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Clock, Lock, MapPin, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildRouterSteps,
  FACULTIES,
  OFFICE_WINDOWS,
  officeStatus,
  type Faculty,
  type Nationality,
  type StepId,
} from "@/lib/copilot/upt";
import { useLocalStorage } from "@/lib/copilot/use-local-storage";

const isoToday = () => new Date().toISOString().slice(0, 10);

export function BureaucracyRouter() {
  const [nationality, setNationality] = useLocalStorage<Nationality>("upt-router-nat", "non-eu");
  const [faculty, setFaculty] = useLocalStorage<Faculty>("upt-router-fac", "AC");
  const [arrival, setArrival] = useLocalStorage<string>("upt-router-arrival", "");
  const [done, setDone] = useLocalStorage<StepId[]>("upt-router-done", []);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const today = now ?? new Date(0);
  const arrivalDate = arrival ? new Date(`${arrival}T12:00:00`) : today;
  const { steps, next } = useMemo(
    () => buildRouterSteps({ nationality, faculty, done, arrival: arrivalDate, today }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nationality, faculty, done, arrival, now],
  );

  const toggle = (id: StepId) =>
    setDone((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  return (
    <div className="space-y-4">
      {next ? (
        <div
          className={`rounded-xl p-4 text-navy-foreground shadow-glow ${next.urgent ? "bg-destructive" : "bg-navy"}`}
        >
          <p className="mb-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest opacity-80">
            {next.urgent ? <Siren className="size-3.5" /> : <ArrowRight className="size-3.5" />}{" "}
            {next.urgent ? "Urgent — do this now" : "Right now at UPT"}
          </p>
          <p className="font-display text-lg font-bold">{next.title}</p>
          <p className="text-sm opacity-80">{next.where}</p>
        </div>
      ) : (
        <div className="rounded-xl bg-success-soft p-4 text-sm font-semibold text-success">
          All steps done — you're officially settled at UPT 🎉
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-card lg:self-start">
          <div>
            <Label className="mb-1.5 block">Nationality</Label>
            <div className="grid grid-cols-2 rounded-lg bg-muted p-1 text-sm">
              {(
                [
                  ["eu", "EU / EEA"],
                  ["non-eu", "Non-EU / Turkish"],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setNationality(v)}
                  className={`rounded-md px-2 py-2 font-medium transition-colors ${nationality === v ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Faculty</Label>
            <Select value={faculty} onValueChange={(v) => setFaculty(v as Faculty)}>
              <SelectTrigger aria-label="Faculty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FACULTIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="arrival">Arrival date in Timișoara</Label>
            <Input
              id="arrival"
              type="date"
              value={arrival}
              max={now ? isoToday() : undefined}
              onChange={(e) => setArrival(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Already done</Label>
            <div className="space-y-1">
              {steps.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={done.includes(s.id)}
                    onChange={() => toggle(s.id)}
                  />
                  <span className={done.includes(s.id) ? "text-muted-foreground line-through" : ""}>
                    {s.title}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <ol className="space-y-2">
            {steps.map((s, i) => {
              const isDone = done.includes(s.id);
              const status = s.office && now ? officeStatus(OFFICE_WINDOWS[s.office], now) : null;
              return (
                <li
                  key={s.id}
                  className={`rounded-xl border bg-card p-4 ${isDone ? "opacity-60" : ""} ${s === next ? "border-primary ring-1 ring-primary" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${isDone ? "bg-success text-success-foreground" : s.locked ? "bg-muted text-muted-foreground" : "bg-primary-soft text-primary"}`}
                    >
                      {isDone ? (
                        <Check className="size-4" />
                      ) : s.locked ? (
                        <Lock className="size-3.5" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold">{s.title}</h3>
                        {s.id === "dorm" && <Badge variant="live">24/7</Badge>}
                        {status && (
                          <Badge variant={status.open ? "live" : "outline"} className="gap-1">
                            <Clock className="size-3" />
                            {status.label}
                          </Badge>
                        )}
                        {s.urgent && !isDone && <Badge variant="danger">Deadline soon</Badge>}
                        {s.locked && <Badge variant="outline">{s.locked}</Badge>}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {s.where}
                      </p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {s.details.map((d) => (
                          <li key={d} className="flex gap-2">
                            <span className="text-primary">•</span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
