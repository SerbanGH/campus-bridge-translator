import { describe, expect, it } from "vitest";
import { buildRouterSteps, doctorForFaculty, igiCountdown, OFFICE_WINDOWS, officeStatus } from "@/lib/copilot/upt";
import { findClashes, UPT_COURSES } from "@/lib/copilot/courses";
import { pollPercentages, testerLabel } from "@/lib/copilot/poll";
import { analyzeLabOffline, LAB_EXAMPLE } from "@/lib/copilot/lab";

// Bucharest is UTC+2 in November.
const bucharest = (iso: string) => new Date(`${iso}+02:00`);

describe("UPT Polyclinic doctor per faculty", () => {
  it("AC and ETC go to Dr. Ana Lupescu", () => {
    expect(doctorForFaculty("AC").name).toBe("Dr. Ana Lupescu");
    expect(doctorForFaculty("ETC").name).toBe("Dr. Ana Lupescu");
  });
  it("Mecanică and Chimie go to Dr. Hortensia Cațu", () => {
    expect(doctorForFaculty("Mecanică").name).toBe("Dr. Hortensia Cațu");
    expect(doctorForFaculty("Chimie").name).toBe("Dr. Hortensia Cațu");
  });
  it("Arhitectură and MPT go to Dr. Anișoara Muller", () => {
    expect(doctorForFaculty("Arhitectură").name).toBe("Dr. Anișoara Muller");
    expect(doctorForFaculty("MPT").name).toBe("Dr. Anișoara Muller");
  });
  it("doctors consult 09:00–15:00", () => {
    expect(doctorForFaculty("AC").hours).toContain("09:00–15:00");
  });
});

describe("Rectorate Room 107 hours", () => {
  it("is open Thursday 15:30", () => {
    expect(officeStatus(OFFICE_WINDOWS.rectorate, bucharest("2026-11-19T15:30:00")).open).toBe(true);
  });
  it("is closed Friday 13:30 (Fri only 12:00–13:00)", () => {
    expect(officeStatus(OFFICE_WINDOWS.rectorate, bucharest("2026-11-20T13:30:00")).open).toBe(false);
  });
  it("is closed Monday 11:00 and opens at 12:00", () => {
    const s = officeStatus(OFFICE_WINDOWS.rectorate, bucharest("2026-11-23T11:00:00"));
    expect(s.open).toBe(false);
    expect(s.label).toContain("12:00");
  });
});

describe("Non-EU IGI permit", () => {
  it("deadline is 30 days after arrival", () => {
    const { daysLeft } = igiCountdown(new Date(2026, 9, 1), new Date(2026, 9, 21));
    expect(daysLeft).toBe(10);
  });
  it("only non-EU students get IGI and bank steps; bank is locked until IGI is done", () => {
    const base = { faculty: "AC" as const, arrival: new Date(2026, 10, 1), today: new Date(2026, 10, 5) };
    const eu = buildRouterSteps({ ...base, nationality: "eu", done: [] });
    expect(eu.steps.map((s) => s.id)).not.toContain("igi");
    const non = buildRouterSteps({ ...base, nationality: "non-eu", done: [] });
    expect(non.steps.find((s) => s.id === "bank")?.locked).toBeTruthy();
    const after = buildRouterSteps({ ...base, nationality: "non-eu", done: ["igi"] });
    expect(after.steps.find((s) => s.id === "bank")?.locked).toBeUndefined();
  });
});

describe("Timetable clashes", () => {
  it("flags Distributed Systems (AC) vs DSP (ETC) on Monday 10–12", () => {
    const pick = UPT_COURSES.filter((c) => c.code === "AC-DS4" || c.code === "ETC-DSP3");
    expect(findClashes(pick)).toHaveLength(1);
  });
  it("back-to-back courses do not clash", () => {
    const pick = UPT_COURSES.filter((c) => c.code === "AC-ML4" || c.code === "CHM-EE3");
    expect(findClashes(pick)).toHaveLength(0);
  });
});

describe("Poll and sign-up counter", () => {
  it("computes percentages", () => {
    const { rows, total } = pollPercentages({ materials: 3, courses: 1 });
    expect(total).toBe(4);
    expect(rows.find((r) => r.id === "materials")?.pct).toBe(75);
  });
  it("tester counter starts at 32+", () => {
    expect(testerLabel(0)).toBe("32+");
    expect(testerLabel(5)).toBe("37+");
  });
});

describe("Offline lab helper", () => {
  it("extracts both dates from the UPT example", () => {
    const r = analyzeLabOffline(LAB_EXAMPLE);
    expect(r.deadlines.map((d) => d.date)).toEqual(["04.12.2026 23:59", "14.01.2027"]);
    expect(r.grading.join(" ")).toContain("40% lab reports + 60% lab exam");
  });
});
