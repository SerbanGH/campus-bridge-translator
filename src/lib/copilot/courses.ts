import type { Faculty } from "./upt";

export type Course = {
  code: string;
  title: string;
  faculty: Faculty;
  year: number;
  ects: number;
  day: 1 | 2 | 3 | 4 | 5;
  start: string; // "HH:MM"
  end: string;
  keywords: string[];
};

// Demo catalogue of UPT courses taught in English (sample data for the prototype).
export const UPT_COURSES: Course[] = [
  {
    code: "AC-DS4",
    title: "Distributed Systems",
    faculty: "AC",
    year: 4,
    ects: 5,
    day: 1,
    start: "10:00",
    end: "12:00",
    keywords: ["distributed", "cloud", "network", "algorithms", "consensus", "computing"],
  },
  {
    code: "AC-ML4",
    title: "Machine Learning",
    faculty: "AC",
    year: 4,
    ects: 5,
    day: 2,
    start: "14:00",
    end: "16:00",
    keywords: ["machine", "learning", "neural", "supervised", "data", "ai"],
  },
  {
    code: "AC-CG3",
    title: "Computer Graphics",
    faculty: "AC",
    year: 3,
    ects: 5,
    day: 3,
    start: "08:00",
    end: "10:00",
    keywords: ["graphics", "rendering", "opengl", "3d", "shaders"],
  },
  {
    code: "AC-ES3",
    title: "Embedded Systems",
    faculty: "AC",
    year: 3,
    ects: 4,
    day: 4,
    start: "12:00",
    end: "14:00",
    keywords: ["embedded", "microcontrollers", "real-time", "firmware", "c"],
  },
  {
    code: "ETC-DSP3",
    title: "Digital Signal Processing",
    faculty: "ETC",
    year: 3,
    ects: 5,
    day: 1,
    start: "10:00",
    end: "12:00",
    keywords: ["signal", "processing", "fourier", "filters", "digital"],
  },
  {
    code: "ETC-WC4",
    title: "Wireless Communications",
    faculty: "ETC",
    year: 4,
    ects: 5,
    day: 3,
    start: "12:00",
    end: "14:00",
    keywords: ["wireless", "communications", "radio", "5g", "antenna"],
  },
  {
    code: "ETC-IOT4",
    title: "Internet of Things",
    faculty: "ETC",
    year: 4,
    ects: 4,
    day: 2,
    start: "15:00",
    end: "17:00",
    keywords: ["iot", "sensors", "embedded", "network", "things"],
  },
  {
    code: "MEC-RB4",
    title: "Industrial Robotics",
    faculty: "Mecanică",
    year: 4,
    ects: 5,
    day: 4,
    start: "12:00",
    end: "14:00",
    keywords: ["robotics", "robot", "kinematics", "control", "automation"],
  },
  {
    code: "MEC-FEA4",
    title: "Finite Element Analysis",
    faculty: "Mecanică",
    year: 4,
    ects: 5,
    day: 5,
    start: "10:00",
    end: "12:00",
    keywords: ["finite", "element", "simulation", "mechanics", "stress"],
  },
  {
    code: "CHM-EE3",
    title: "Environmental Engineering",
    faculty: "Chimie",
    year: 3,
    ects: 4,
    day: 2,
    start: "10:00",
    end: "12:00",
    keywords: ["environmental", "water", "pollution", "sustainability"],
  },
  {
    code: "ARH-SUD4",
    title: "Sustainable Urban Design",
    faculty: "Arhitectură",
    year: 4,
    ects: 6,
    day: 3,
    start: "10:00",
    end: "13:00",
    keywords: ["urban", "design", "architecture", "sustainability", "planning"],
  },
  {
    code: "CON-SD4",
    title: "Structural Dynamics",
    faculty: "Construcții",
    year: 4,
    ects: 5,
    day: 1,
    start: "14:00",
    end: "16:00",
    keywords: ["structural", "dynamics", "earthquake", "civil", "mechanics"],
  },
  {
    code: "MPT-PM3",
    title: "Project Management",
    faculty: "MPT",
    year: 3,
    ects: 4,
    day: 4,
    start: "16:00",
    end: "18:00",
    keywords: ["project", "management", "agile", "planning", "business"],
  },
  {
    code: "MPT-LSC4",
    title: "Logistics & Supply Chain",
    faculty: "MPT",
    year: 4,
    ects: 5,
    day: 5,
    start: "12:00",
    end: "14:00",
    keywords: ["logistics", "supply", "chain", "transport", "operations"],
  },
];

export const DAY_LABELS = ["", "Mon", "Tue", "Wed", "Thu", "Fri"] as const;

const toMin = (t: string) => {
  const [hh = "0", mm = "0"] = t.split(":");
  return Number(hh) * 60 + Number(mm);
};

export function overlaps(a: Course, b: Course) {
  return a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);
}

export function findClashes(courses: Course[]): [Course, Course][] {
  const out: [Course, Course][] = [];
  for (let i = 0; i < courses.length; i++)
    for (let j = i + 1; j < courses.length; j++) {
      const a = courses[i];
      const b = courses[j];
      if (a && b && overlaps(a, b)) out.push([a, b]);
    }
  return out;
}

export type HomeCourse = { title: string; ects?: number | undefined; text: string };

/** Split pasted home-course descriptions into blocks (one per line/paragraph that starts a course). */
export function parseHomeCourses(input: string): HomeCourse[] {
  return input
    .split(/\n\s*\n|\n(?=[A-Z]{2,4}\s?\d)/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const firstLine = block.split("\n")[0] ?? block;
      const ectsMatch = block.match(/(\d+(?:[.,]\d)?)\s*ECTS/i);
      const title =
        firstLine
          .replace(/\(.*?\)/g, "")
          .split(/[:–-]/)[0]
          ?.trim() || firstLine;
      return {
        title,
        ects: ectsMatch?.[1] ? Number(ectsMatch[1].replace(",", ".")) : undefined,
        text: block.toLowerCase(),
      };
    });
}

export type Recommendation = { course: Course; matchedHome: string; similarity: number };

export function recommendCourses(
  home: HomeCourse[],
  faculties: Faculty[],
  targetEcts: number,
): Recommendation[] {
  const pool = UPT_COURSES.filter((c) => faculties.includes(c.faculty));
  const scored: Recommendation[] = [];
  for (const course of pool) {
    let best = { home: "", score: 0 };
    for (const h of home) {
      const hits = course.keywords.filter((k) => new RegExp(`\\b${k}`, "i").test(h.text)).length;
      const score = Math.min(1, hits / 3);
      if (score > best.score) best = { home: h.title, score };
    }
    if (best.score > 0) scored.push({ course, matchedHome: best.home, similarity: best.score });
  }
  scored.sort((a, b) => b.similarity - a.similarity || b.course.ects - a.course.ects);
  const picked: Recommendation[] = [];
  let total = 0;
  for (const r of scored) {
    if (total >= targetEcts) break;
    picked.push(r);
    total += r.course.ects;
  }
  return picked;
}

export function ectsMatchScore(selected: Course[], target: number) {
  const total = selected.reduce((s, c) => s + c.ects, 0);
  const pct = target > 0 ? Math.round((Math.min(total, target) / target) * 100) : 0;
  return { total, pct };
}

export function learningAgreementText(recs: Recommendation[], homeUni: string) {
  if (recs.length === 0) return "";
  const lines = recs.map(
    (r) =>
      `• ${r.course.title} (${r.course.code}, ${r.course.ects} ECTS, Faculty of ${r.course.faculty}) is proposed as the equivalent of "${r.matchedHome}". Both cover ${r.course.keywords.slice(0, 3).join(", ")} at a comparable level (UPT year ${r.course.year}).`,
  );
  return `Learning Agreement — justification of course equivalence\nHome institution: ${homeUni || "[Home university]"} · Host: Politehnica University of Timișoara\n\n${lines.join("\n")}\n\nThe selected UPT courses are taught in English, together total ${recs.reduce((s, r) => s + r.course.ects, 0)} ECTS, and were checked for timetable overlaps across faculties.`;
}
