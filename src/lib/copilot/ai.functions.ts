import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { LabAnalysis } from "./lab";
import { UPT_COURSES } from "./courses";

const MODEL = "google/gemini-3.8-flash" as const;

async function askJson(system: string, user: string, file?: { dataUrl: string }) {
  const { generateChatCompletion, GatewayError } = await import("@lovable.dev/ai-gateway");
  try {
    const res = await generateChatCompletion({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: file
            ? [
                { type: "text", text: user },
                { type: "image_url", image_url: { url: file.dataUrl } },
              ]
            : user,
        },
      ],
    });
    const text = res.choices[0]?.message.content ?? "";
    return JSON.parse(text) as unknown;
  } catch (err) {
    if (err instanceof GatewayError) {
      if (err.httpStatus === 429)
        throw new Error(
          "The AI is busy right now — try again in a minute, or switch to Demo mode.",
        );
      if (err.httpStatus === 402)
        throw new Error("AI credits have run out — switch to Demo mode for now.");
      throw new Error("Live AI is unavailable right now — Demo mode still works.");
    }
    if (err instanceof SyntaxError)
      throw new Error("The AI returned an unexpected answer — please try again.");
    throw err;
  }
}

const labSchema = z.object({
  courseTitle: z.string(),
  summary: z.string(),
  terms: z.array(z.object({ ro: z.string(), en: z.string() })).default([]),
  deadlines: z
    .array(z.object({ date: z.string(), label: z.string(), detail: z.string() }))
    .default([]),
  grading: z.array(z.string()).default([]),
  emailRo: z.string(),
  emailEn: z.string(),
});

export const analyzeLabAi = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        text: z.string().max(20000),
        pdfDataUrl: z.string().max(8_000_000).startsWith("data:application/pdf;base64,").optional(),
      })
      .refine((v) => v.text.trim().length > 0 || v.pdfDataUrl, "Paste some text or attach a PDF")
      .parse(d),
  )
  .handler(async ({ data }): Promise<LabAnalysis> => {
    const system = `You help incoming Erasmus students at Politehnica University of Timișoara (UPT) understand Romanian course announcements from the Virtual Campus (cv.upt.ro) and lab PDFs.
Return ONLY JSON with keys:
courseTitle (string, Romanian name of the course/lab),
summary (string, 2-4 sentence plain-English summary),
terms (array of {ro, en} — 4 to 10 key Romanian technical/academic terms with English meaning),
deadlines (array of {date: "DD.MM.YYYY[ HH:MM]", label: short English label, detail: one English sentence}),
grading (array of short English sentences: grade weights, penalties, attendance, minimum grades),
emailRo (a polite formal Romanian email with a "Subiect:" first line to the professor/lab assistant asking to confirm the key deadline and whether the assessment or materials can be in English; use placeholders [Numele dvs.], [Universitatea de origine], [Email / WhatsApp]),
emailEn (English translation of that email).`;
    const json = await askJson(
      system,
      data.text.trim() || "Analyse the attached document.",
      data.pdfDataUrl ? { dataUrl: data.pdfDataUrl } : undefined,
    );
    return labSchema.parse(json);
  });

const courseSchema = z.object({
  picks: z.array(
    z.object({ code: z.string(), matchedHome: z.string(), similarity: z.number().min(0).max(1) }),
  ),
  justification: z.string(),
});

export const matchCoursesAi = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        homeText: z.string().min(10).max(8000),
        targetEcts: z.number().min(1).max(60),
        faculties: z.array(z.string()).min(1).max(7),
        homeUni: z.string().max(120),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const catalogue = UPT_COURSES.filter((c) => data.faculties.includes(c.faculty)).map(
      ({ code, title, faculty, year, ects, keywords }) => ({
        code,
        title,
        faculty,
        year,
        ects,
        topics: keywords,
      }),
    );
    const system = `You build Erasmus Learning Agreements for students going to Politehnica University of Timișoara (UPT).
Pick UPT courses ONLY from the provided catalogue (use their exact "code") that best match the student's home courses, aiming for the target ECTS without going far over.
Return ONLY JSON: {"picks":[{"code","matchedHome": home course title it replaces,"similarity": 0..1}], "justification": ready-to-paste formal English Learning Agreement justification paragraph(s) naming each UPT course, its ECTS and the home course it replaces}.`;
    const user = `Home university: ${data.homeUni || "not given"}\nTarget ECTS: ${data.targetEcts}\nHome courses:\n${data.homeText}\n\nUPT catalogue:\n${JSON.stringify(catalogue)}`;
    const parsed = courseSchema.parse(await askJson(system, user));
    const valid = new Set(catalogue.map((c) => c.code));
    return {
      picks: parsed.picks.filter((p) => valid.has(p.code)),
      justification: parsed.justification,
    };
  });
