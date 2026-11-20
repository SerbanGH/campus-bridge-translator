import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, ClipboardList, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { matchCoursesAi } from "@/lib/copilot/ai.functions";
import {
  DAY_LABELS,
  ectsMatchScore,
  findClashes,
  learningAgreementText,
  parseHomeCourses,
  recommendCourses,
  UPT_COURSES,
  type Recommendation,
} from "@/lib/copilot/courses";
import { FACULTIES, type Faculty } from "@/lib/copilot/upt";
import { useAiMode } from "./ai-mode";
import { CopyButton } from "./copy-button";

const HOME_EXAMPLE = `CS301 Distributed Computing (6 ECTS): distributed algorithms, cloud computing, consensus, networks.

CS320 Machine Learning (6 ECTS): supervised learning, neural networks, data preprocessing.

EE210 Signal Processing (5 ECTS): Fourier transform, digital filters, sampling.

ME400 Robotics (5 ECTS): robot kinematics, control systems, automation.

CS250 Embedded Programming (5 ECTS): microcontrollers, real-time systems, C firmware.`;

export function CourseMatcher() {
  const { live } = useAiMode();
  const matchAi = useServerFn(matchCoursesAi);
  const [homeText, setHomeText] = useState("");
  const [homeUni, setHomeUni] = useState("");
  const [target, setTarget] = useState(30);
  const [faculties, setFaculties] = useState<Faculty[]>(["AC", "ETC", "Mecanică"]);
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [aiText, setAiText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleFaculty = (f: Faculty) =>
    setFaculties((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  const run = async () => {
    if (homeText.trim().length < 10) {
      toast.error("Paste your home course descriptions or load the example");
      return;
    }
    if (faculties.length === 0) {
      toast.error("Pick at least one UPT faculty");
      return;
    }
    setLoading(true);
    setAiText(null);
    try {
      let out: Recommendation[];
      if (live) {
        const r = await matchAi({ data: { homeText, targetEcts: target, faculties, homeUni } });
        out = r.picks.flatMap((p) => {
          const course = UPT_COURSES.find((c) => c.code === p.code);
          return course ? [{ course, matchedHome: p.matchedHome, similarity: p.similarity }] : [];
        });
        setAiText(r.justification);
      } else {
        out = recommendCourses(parseHomeCourses(homeText), faculties, target);
      }
      if (out.length === 0) toast("No close matches — try adding more faculties.");
      setRecs(out);
      setSelected(out.map((r) => r.course.code));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      const out = recommendCourses(parseHomeCourses(homeText), faculties, target);
      setRecs(out);
      setSelected(out.map((r) => r.course.code));
    } finally {
      setLoading(false);
    }
  };

  const chosen = useMemo(
    () => (recs ?? []).filter((r) => selected.includes(r.course.code)),
    [recs, selected],
  );
  const clashes = useMemo(() => findClashes(chosen.map((r) => r.course)), [chosen]);
  const score = ectsMatchScore(
    chosen.map((r) => r.course),
    target,
  );
  const clashCodes = new Set(clashes.flat().map((c) => c.code));
  const laText =
    aiText && chosen.length === recs?.length ? aiText : learningAgreementText(chosen, homeUni);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-3">
        <Button
          type="button"
          variant="soft"
          size="sm"
          onClick={() => {
            setHomeText(HOME_EXAMPLE);
            setHomeUni("TU Berlin");
            setFaculties(["AC", "ETC", "Mecanică"]);
            setTarget(30);
          }}
        >
          <ClipboardList /> Load example home courses
        </Button>
        <Textarea
          value={homeText}
          onChange={(e) => setHomeText(e.target.value)}
          rows={9}
          placeholder="Paste your home university course descriptions with ECTS…"
          className="text-xs leading-relaxed"
        />
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="home-uni">Home university</Label>
            <Input
              id="home-uni"
              value={homeUni}
              onChange={(e) => setHomeUni(e.target.value)}
              placeholder="e.g. TU Berlin"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="target">Target ECTS</Label>
            <Input
              id="target"
              type="number"
              min={1}
              max={60}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value) || 0)}
            />
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block">UPT faculties to search</Label>
          <div className="flex flex-wrap gap-1.5">
            {FACULTIES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFaculty(f)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${faculties.includes(f) ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <Button
          type="button"
          variant="hero"
          size="xl"
          className="w-full"
          onClick={run}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}{" "}
          {loading ? "Matching…" : "Match courses & check clashes"}
        </Button>
      </div>

      <div className="space-y-4">
        {!recs ? (
          <div className="grid h-full min-h-60 place-items-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Recommended UPT English courses, your ECTS score and timetable clashes appear here.
          </div>
        ) : (
          <>
            <div className="rounded-xl border bg-card p-4 shadow-card">
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    ECTS match
                  </p>
                  <p className="font-display text-2xl font-bold">
                    {score.total} / {target}{" "}
                    <span className="text-base text-muted-foreground">ECTS</span>
                  </p>
                </div>
                <Badge variant={score.pct >= 90 ? "success" : "warning"} className="text-sm">
                  {score.pct}%
                </Badge>
              </div>
              <Progress value={score.pct} />
            </div>

            {clashes.length > 0 ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-destructive">
                  <AlertTriangle className="size-4" /> {clashes.length} timetable clash
                  {clashes.length > 1 ? "es" : ""} across faculties
                </p>
                <ul className="space-y-1 text-sm">
                  {clashes.map(([a, b]) => (
                    <li key={a.code + b.code}>
                      <span className="font-semibold">{a.title}</span> ({a.faculty}, Y{a.year})
                      overlaps <span className="font-semibold">{b.title}</span> ({b.faculty}, Y
                      {b.year}) — {DAY_LABELS[a.day]} {a.start}–{a.end}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  Untick one course of each pair to resolve it.
                </p>
              </div>
            ) : chosen.length > 0 ? (
              <p className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
                <CheckCircle2 className="size-4" /> No timetable overlaps in your selection
              </p>
            ) : null}

            <ul className="space-y-2">
              {recs.map((r) => {
                const on = selected.includes(r.course.code);
                return (
                  <li key={r.course.code}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-3 transition-colors ${on ? "" : "opacity-60"} ${clashCodes.has(r.course.code) && on ? "border-destructive/50" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 size-4 accent-primary"
                        checked={on}
                        onChange={() =>
                          setSelected((cur) =>
                            on ? cur.filter((c) => c !== r.course.code) : [...cur, r.course.code],
                          )
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
                          {r.course.title}{" "}
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {r.course.faculty} · Y{r.course.year}
                          </Badge>
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          replaces “{r.matchedHome}” · {DAY_LABELS[r.course.day]} {r.course.start}–
                          {r.course.end}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-sm font-bold">{r.course.ects} ECTS</span>
                        <span className="block text-xs text-success">
                          {Math.round(r.similarity * 100)}% match
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            {laText && (
              <div className="rounded-xl border bg-card p-4 shadow-card">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold">Learning Agreement justification</h3>
                  <CopyButton text={laText} />
                </div>
                <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 font-sans text-xs leading-relaxed">
                  {laText}
                </pre>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Course list and schedule are a demo catalogue — confirm on your faculty's official
              timetable.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
