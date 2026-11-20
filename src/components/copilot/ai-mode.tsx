import { createContext, useContext, type ReactNode } from "react";
import { Sparkles, WifiOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useLocalStorage } from "@/lib/copilot/use-local-storage";

const AiModeContext = createContext<{ live: boolean; setLive: (v: boolean) => void }>({
  live: false,
  setLive: () => {},
});

export function AiModeProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useLocalStorage("upt-live-ai", false);
  return <AiModeContext.Provider value={{ live, setLive }}>{children}</AiModeContext.Provider>;
}

export const useAiMode = () => useContext(AiModeContext);

export function AiModeToggle() {
  const { live, setLive } = useAiMode();
  return (
    <label className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2 shadow-card">
      <span
        className={`grid size-8 place-items-center rounded-lg ${live ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}`}
      >
        {live ? <Sparkles className="size-4" /> : <WifiOff className="size-4" />}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-sm font-semibold">
          {live ? "Live AI (Gemini)" : "Offline demo mode"}
        </span>
        <span className="block text-xs text-muted-foreground">
          {live
            ? "Real answers from Gemini — no key needed"
            : "Instant pre-loaded UPT examples, works without internet"}
        </span>
      </span>
      <Switch checked={live} onCheckedChange={setLive} aria-label="Use live AI" />
    </label>
  );
}
