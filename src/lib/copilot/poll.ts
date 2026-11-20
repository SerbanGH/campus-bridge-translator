export const POLL_OPTIONS = [
  { id: "materials", label: "Romanian materials & Virtual Campus (cv.upt.ro)" },
  { id: "courses", label: "Course matching & timetable overlaps" },
  { id: "bureaucracy", label: "UPT Secretariat, Polyclinic & IGI permits" },
  { id: "dorm", label: "Dorm 11C deposit & missing room items" },
] as const;
export type PollOptionId = (typeof POLL_OPTIONS)[number]["id"];

export function pollPercentages(counts: Partial<Record<PollOptionId, number>>) {
  const total = POLL_OPTIONS.reduce((s, o) => s + (counts[o.id] ?? 0), 0);
  return {
    total,
    rows: POLL_OPTIONS.map((o) => {
      const votes = counts[o.id] ?? 0;
      return { ...o, votes, pct: total ? Math.round((votes / total) * 100) : 0 };
    }),
  };
}

export const SIGNUP_BASE = 32;
export const testerLabel = (signups: number) => `${SIGNUP_BASE + signups}+`;
