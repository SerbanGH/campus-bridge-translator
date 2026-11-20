import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookOpenText, CalendarClock, FileUp, Loader2, Mail, Scale, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeLabAi } from "@/lib/copilot/ai.functions";
import { analyzeLabOffline, LAB_EXAMPLE, type LabAnalysis } from "@/lib/copilot/lab";
import { useAiMode } from "./ai-mode";
import { CopyButton } from "./copy-button";
import { VirtualCampusPanel, type VcPick } from "./vc-panel";

export function LabHelper() {
  const { live } = useAiMode();
  const analyze = useServerFn(analyzeLabAi);
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [pdf, setPdf] = useState<{ name: string; dataUrl: string } | null>(null);
  const [result, setResult] = useState<(LabAnalysis & { source: "ai" | "demo" }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"ro" | "en">("ro");

  const onFile = async (file: File) => {
    if (file.type === "application/pdf") {
      if (file.size > 5_000_000) {
        toast.error("PDF is too large (max 5 MB)");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPdf({ name: file.name, dataUrl: String(reader.result) });
        if (!live) toast("PDFs are read with Live AI — switch it on above, or paste the text.");
      };
      reader.readAsDataURL(file);
    } else {
      setText(await file.text());
      setPdf(null);
    }
  };

  const fromVc = (p: VcPick) => {
    if ("pdfDataUrl" in p) {
      setPdf({ name: p.title, dataUrl: p.pdfDataUrl });
      setText("");
      if (!live) toast("PDFs are read with Live AI — switch it on above.");
    } else {
      setText(p.text);
      setPdf(null);
    }
    toast.success(`Loaded “${p.title}” — tap Translate & extract`);
  };

  const run = async () => {
    if (!text.trim() && !pdf) {
      toast.error("Paste an announcement or load the UPT example");
      return;
    }
    setLoading(true);
    try {
      if (live) {
        const r = await analyze({ data: { text, ...(pdf ? { pdfDataUrl: pdf.dataUrl } : {}) } });
        setResult({ ...r, source: "ai" });
      } else {
        if (!text.trim()) throw new Error("Switch on Live AI to read PDFs, or paste the text");
        setResult({ ...analyzeLabOffline(text), source: "demo" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      if (live && text.trim()) setResult({ ...analyzeLabOffline(text), source: "demo" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-3">
        <VirtualCampusPanel onPick={fromVc} />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={() => {
              setText(LAB_EXAMPLE);
              setPdf(null);
            }}
          >
            <BookOpenText /> Load Real UPT Romanian Lab Example
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <FileUp /> Upload file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.pdf,text/plain,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </div>
        {pdf && (
          <div className="flex items-center justify-between rounded-lg border bg-muted px-3 py-2 text-sm">
            <span className="truncate">📄 {pdf.name}</span>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setPdf(null)}
            >
              Remove
            </button>
          </div>
        )}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder="Paste a Romanian Virtual Campus (cv.upt.ro) announcement or lab text…"
          className="font-mono text-xs leading-relaxed"
        />
        <Button
          type="button"
          variant="hero"
          size="xl"
          className="w-full"
          onClick={run}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" /> : <Wand2 />}{" "}
          {loading ? "Translating…" : "Translate & extract"}
        </Button>
      </div>

      <div className="space-y-4">
        {!result ? (
          <div className="grid h-full min-h-60 place-items-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Your English summary, deadlines and a ready-to-send Romanian email appear here.
          </div>
        ) : (
          <>
            <ResultCard
              icon={BookOpenText}
              title="1 · English summary & key terms"
              badge={result.source === "ai" ? "Gemini" : "Demo"}
            >
              <p className="text-sm leading-relaxed">{result.summary}</p>
              {result.terms.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {result.terms.map((t) => (
                    <span key={t.ro} className="rounded-md bg-muted px-2 py-1 text-xs">
                      <span className="font-semibold">{t.ro}</span>{" "}
                      <span className="text-muted-foreground">→ {t.en}</span>
                    </span>
                  ))}
                </div>
              )}
            </ResultCard>
            <ResultCard icon={CalendarClock} title="2 · Deadlines & grading rules">
              {result.deadlines.length === 0 && result.grading.length === 0 && (
                <p className="text-sm text-muted-foreground">No dates or grading rules found.</p>
              )}
              <ul className="space-y-2">
                {result.deadlines.map((d, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <Badge variant="warning" className="h-fit shrink-0 font-mono">
                      {d.date}
                    </Badge>
                    <span>
                      <span className="font-semibold">{d.label}</span>{" "}
                      <span className="text-muted-foreground">— {d.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {result.grading.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t pt-3">
                  {result.grading.map((g) => (
                    <li key={g} className="flex gap-2 text-sm">
                      <Scale className="mt-0.5 size-4 shrink-0 text-primary" />
                      {g}
                    </li>
                  ))}
                </ul>
              )}
            </ResultCard>
            <ResultCard icon={Mail} title="3 · Polite email to your professor">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex rounded-lg bg-muted p-0.5 text-xs">
                  {(["ro", "en"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={`rounded-md px-2.5 py-1 font-medium ${lang === l ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                    >
                      {l === "ro" ? "Română (send this)" : "English meaning"}
                    </button>
                  ))}
                </div>
                <CopyButton text={lang === "ro" ? result.emailRo : result.emailEn} />
              </div>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 font-sans text-xs leading-relaxed">
                {lang === "ro" ? result.emailRo : result.emailEn}
              </pre>
            </ResultCard>
          </>
        )}
      </div>
    </div>
  );
}

function ResultCard({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: typeof Mail;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h3 className="flex-1 text-sm font-bold">{title}</h3>
        {badge && <Badge variant={badge === "Gemini" ? "soft" : "outline"}>{badge}</Badge>}
      </div>
      {children}
    </div>
  );
}
