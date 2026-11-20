// UPT operational facts and rules used by the Bureaucracy Router and Dorm tools.
export const FACULTIES = [
  "AC",
  "ETC",
  "Mecanică",
  "Arhitectură",
  "Construcții",
  "Chimie",
  "MPT",
] as const;
export type Faculty = (typeof FACULTIES)[number];

export const FACULTY_NAMES: Record<Faculty, string> = {
  AC: "Automatică și Calculatoare",
  ETC: "Electronică, Telecomunicații și TI",
  Mecanică: "Mecanică",
  Arhitectură: "Arhitectură și Urbanism",
  Construcții: "Construcții",
  Chimie: "Chimie Industrială și Ingineria Mediului",
  MPT: "Management în Producție și Transporturi",
};

export type Nationality = "eu" | "non-eu";

export const POLYCLINIC_HOURS = "Mon–Fri 09:00–15:00";

const DOCTORS: Record<Faculty, string> = {
  AC: "Dr. Ana Lupescu",
  ETC: "Dr. Ana Lupescu",
  Mecanică: "Dr. Hortensia Cațu",
  Chimie: "Dr. Hortensia Cațu",
  Arhitectură: "Dr. Anișoara Muller",
  MPT: "Dr. Anișoara Muller",
  Construcții: "Dr. Mihai Dragomir",
};

export function doctorForFaculty(faculty: Faculty): { name: string; hours: string } {
  return { name: DOCTORS[faculty], hours: POLYCLINIC_HOURS };
}

export const DORM_DEPOSIT_RON = 600;
export const IGI_DEADLINE_DAYS = 30;

/** Weekday 0=Sun..6=Sat, hours/minutes in Europe/Bucharest. */
export function bucharestClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Bucharest",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    weekday: days.indexOf(get("weekday")),
    minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")),
  };
}

type Window = { day: number; from: number; to: number };
const h = (hh: number, mm = 0) => hh * 60 + mm;

export const OFFICE_WINDOWS: Record<"rectorate" | "polyclinic", Window[]> = {
  // Rectorate Room 107: Mon–Thu 12:00–16:00, Fri 12:00–13:00
  rectorate: [1, 2, 3, 4]
    .map((day) => ({ day, from: h(12), to: h(16) }))
    .concat([{ day: 5, from: h(12), to: h(13) }]),
  polyclinic: [1, 2, 3, 4, 5].map((day) => ({ day, from: h(9), to: h(15) })),
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fmt = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function officeStatus(windows: Window[], now: Date): { open: boolean; label: string } {
  const { weekday, minutes } = bucharestClock(now);
  const current = windows.find((w) => w.day === weekday && minutes >= w.from && minutes < w.to);
  if (current) return { open: true, label: `Open now · closes ${fmt(current.to)}` };
  for (let offset = 0; offset < 8; offset++) {
    const day = (weekday + offset) % 7;
    const next = windows
      .filter((w) => w.day === day && (offset > 0 || w.from > minutes))
      .sort((a, b) => a.from - b.from)[0];
    if (next) {
      const when = offset === 0 ? "today" : offset === 1 ? "tomorrow" : DAY_NAMES[day];
      return { open: false, label: `Closed · opens ${when} ${fmt(next.from)}` };
    }
  }
  return { open: false, label: "Closed" };
}

export function daysBetween(from: Date, to: Date) {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000);
}

export function igiCountdown(arrival: Date, today: Date) {
  const deadline = new Date(arrival);
  deadline.setDate(deadline.getDate() + IGI_DEADLINE_DAYS);
  return { deadline, daysLeft: daysBetween(today, deadline) };
}

export function nextTuesday(from: Date) {
  const d = new Date(from);
  const add = (2 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + add);
  return d;
}

export type StepId = "dorm" | "rectorate" | "polyclinic" | "igi" | "bank";
export type RouterStep = {
  id: StepId;
  title: string;
  where: string;
  details: string[];
  office?: "rectorate" | "polyclinic";
  urgent?: boolean;
  locked?: string | undefined;
};

export function buildRouterSteps(opts: {
  nationality: Nationality;
  faculty: Faculty;
  done: StepId[];
  arrival: Date;
  today: Date;
}): { steps: RouterStep[]; next: RouterStep | undefined } {
  const doc = doctorForFaculty(opts.faculty);
  const steps: RouterStep[] = [
    {
      id: "dorm",
      title: "Collect your Dorm 11C key",
      where: "Dorm 8C porter's desk — open 24/7",
      details: [
        "Keys for Dorm 11C are handed out at Dorm 8C, not at 11C itself.",
        `A ${DORM_DEPOSIT_RON} RON warranty is held against room damage — keep the receipt.`,
        "Photograph the room on day 1 with the Deposit Guard below.",
      ],
    },
    {
      id: "rectorate",
      title: "Register at the Rectorate, Room 107",
      where: "Piața Victoriei 2 · Mon–Thu 12:00–16:00, Fri 12:00–13:00",
      office: "rectorate",
      details: [
        "Bring your passport/ID, nomination letter and dorm receipt.",
        "Fridays are only one hour — aim for Mon–Thu.",
      ],
    },
    {
      id: "polyclinic",
      title: `See ${doc.name} at the Student Polyclinic`,
      where: `${doc.name} covers ${opts.faculty} students · ${doc.hours}`,
      office: "polyclinic",
      details: [
        "Register with your faculty's family doctor for medical certificates and sick notes.",
      ],
    },
  ];

  if (opts.nationality === "non-eu") {
    const { deadline, daysLeft } = igiCountdown(opts.arrival, opts.today);
    const tue = nextTuesday(opts.today);
    steps.push({
      id: "igi",
      title: "Apply for your IGI Residence Permit",
      where: "Str. Andrei Mocioni 8–10 · Tuesdays only",
      urgent: daysLeft <= 10,
      details: [
        daysLeft >= 0
          ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left — deadline ${deadline.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} (30 days from arrival).`
          : `Deadline passed ${Math.abs(daysLeft)} day(s) ago — go this Tuesday.`,
        `Next Tuesday slot: ${tue.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}.`,
      ],
    });
    steps.push({
      id: "bank",
      title: "Open Revolut or a Romanian bank account",
      where: "After your residence permit is issued",
      locked: opts.done.includes("igi") ? undefined : "Needs your IGI residence permit first",
      details: ["Revolut and Romanian banks ask non-EU students for the residence permit."],
    });
  }

  const pending = steps.filter((s) => !opts.done.includes(s.id) && !s.locked);
  const next = pending.find((s) => s.urgent) ?? pending[0];
  return { steps, next };
}
