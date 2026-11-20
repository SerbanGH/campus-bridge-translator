import { useState } from "react";
import { BedDouble, CalendarRange, Languages, Landmark } from "lucide-react";
import { AiModeToggle } from "./ai-mode";
import { BureaucracyRouter } from "./bureaucracy-router";
import { CourseMatcher } from "./course-matcher";
import { DormGuard } from "./dorm-guard";
import { LabHelper } from "./lab-helper";
import { SectionHeading } from "./section-heading";

const TABS = [
  {
    id: "lab",
    short: "Romanian Lab Helper",
    title: "Virtual Campus (cv.upt.ro) & Romanian Lab Helper",
    icon: Languages,
    tag: "Primary wedge",
    el: LabHelper,
  },
  {
    id: "courses",
    short: "Course & Clash Matcher",
    title: "Cross-Faculty Course & Timetable Clash Matcher",
    icon: CalendarRange,
    el: CourseMatcher,
  },
  {
    id: "router",
    short: "Right Now at UPT",
    title: "Right Now at UPT — Smart Bureaucracy Router",
    icon: Landmark,
    el: BureaucracyRouter,
  },
  {
    id: "dorm",
    short: "Dorm 11C Guard",
    title: "Dorm 11C Deposit Guard & Pass-Down",
    icon: BedDouble,
    el: DormGuard,
  },
] as const;

export function Workspace() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("lab");
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];
  const Panel = active.el;
  return (
    <section id="workspace" className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow="Interactive AI workspace"
          title="Four hyper-local tools, pre-loaded with real UPT cases"
        >
          Try them with the demo examples, or switch on Live AI for your own documents.
        </SectionHeading>
        <div className="mb-6 lg:w-96">
          <AiModeToggle />
        </div>
      </div>

      <div
        role="tablist"
        aria-label="AI tools"
        className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-all ${on ? "border-primary bg-primary text-primary-foreground shadow-glow" : "bg-card hover:border-primary/40"}`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="whitespace-nowrap">{t.short}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border bg-secondary/60 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold">{active.title}</h3>
          {"tag" in active && (
            <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
              {active.tag}
            </span>
          )}
        </div>
        <Panel />
      </div>
    </section>
  );
}
