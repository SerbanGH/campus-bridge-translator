export type LabAnalysis = {
  courseTitle: string;
  summary: string;
  terms: { ro: string; en: string }[];
  deadlines: { date: string; label: string; detail: string }[];
  grading: string[];
  emailRo: string;
  emailEn: string;
};

export const LAB_EXAMPLE = `ANUNȚ – Laborator Sisteme de Operare (SO), anul III, Facultatea de Automatică și Calculatoare

Stimați studenți,

Laboratorul nr. 5 (Sincronizarea proceselor – semafoare și mutex) se desfășoară în sala ASPC B418, conform orarului.
Referatul de laborator se încarcă pe Campusul Virtual (cv.upt.ro) până la data de 04.12.2026, ora 23:59. Predările întârziate se penalizează cu 1 punct/zi.
Colocviul de laborator va avea loc în data de 14.01.2027, în sala B418.

Nota finală la laborator: 40% referate, 60% colocviu.
Prezența la laborator este obligatorie; maximum 2 absențe motivate se pot recupera în săptămâna 14.
Accesul la examenul final este condiționat de promovarea laboratorului (nota minimă 5).

Cu stimă,
Ș.l. dr. ing. Ion Popescu`;

const GLOSSARY: [RegExp, string, string][] = [
  [/laborator/i, "laborator", "lab session"],
  [/referat/i, "referat", "lab report"],
  [/colocviu/i, "colocviu", "lab exam (practical/oral)"],
  [/sincronizarea proceselor/i, "sincronizarea proceselor", "process synchronization"],
  [/semafoare/i, "semafoare", "semaphores"],
  [/prezen[țt]a .*obligatorie/i, "prezența obligatorie", "mandatory attendance"],
  [/absen[țt]e motivate/i, "absențe motivate", "excused absences"],
  [/nota final[ăa]/i, "nota finală", "final grade"],
  [/nota minim[ăa]/i, "nota minimă", "minimum passing grade"],
  [/examen/i, "examen", "exam"],
  [/restan[țt][ăa]/i, "restanță", "resit exam"],
  [/sesiune/i, "sesiune", "exam session"],
  [/tem[ăa]/i, "temă", "assignment"],
  [/proiect/i, "proiect", "project"],
  [/termen/i, "termen", "deadline"],
  [/se penalizeaz[ăa]/i, "se penalizează", "is penalised"],
  [/orar/i, "orar", "timetable"],
  [/sala/i, "sala", "room"],
  [/condi[țt]ionat/i, "condiționat de", "conditional on"],
];

function deadlineLabel(sentence: string) {
  const s = sentence.toLowerCase();
  if (/colocviu/.test(s)) return "Lab exam (colocviu)";
  if (/examen/.test(s)) return "Exam";
  if (/test|parțial|partial/.test(s)) return "Test";
  if (/înc[aă]rc|pred|trimit|upload|referat|tem[ăa]/.test(s)) return "Submission deadline";
  return "Date mentioned";
}

function extractCourse(text: string) {
  const m = text.match(/(?:Laborator(?:ul)?|Curs(?:ul)?|Disciplina)\s+([A-ZĂÂÎȘȚ][^,\n(–-]{2,60})/);
  return m?.[1]?.trim() ?? "the course";
}

function extractProfessor(text: string) {
  const m = text.match(/((?:Prof\.|Conf\.|Ș\.l\.|S\.l\.|Lect\.|As\.)[^\n]{3,60})/);
  return m?.[1]?.trim();
}

export function buildEmails(
  course: string,
  professor: string | undefined,
  firstDeadline?: { date: string; label: string },
) {
  const greet = professor
    ? `Stimate/Stimată ${professor},`
    : "Stimate domnule profesor / Stimată doamnă profesoară,";
  const q1 = firstDeadline
    ? `1. Termenul pentru ${firstDeadline.label === "Submission deadline" ? "predarea referatului" : "evaluare"} rămâne ${firstDeadline.date}?`
    : "1. Care sunt termenele și condițiile de evaluare pentru acest laborator?";
  const emailRo = `Subiect: Solicitare clarificări – ${course} (student Erasmus+)

${greet}

Mă numesc [Numele dvs.] și sunt student(ă) Erasmus+ la Universitatea Politehnica Timișoara în acest semestru, înscris(ă) la ${course}.

Deoarece nu vorbesc încă fluent limba română, vă rog respectuos să-mi confirmați următoarele:
${q1}
2. Ar fi posibil să susțin evaluarea în limba engleză sau să primesc materialele în limba engleză?

Vă mulțumesc anticipat pentru înțelegere și sprijin.

Cu stimă,
[Numele dvs.]
Student(ă) Erasmus+, [Universitatea de origine]
[Email / WhatsApp]`;
  const emailEn = `Subject: Request for clarification – ${course} (Erasmus+ student)

Dear ${professor ?? "Professor"},

My name is [Your name] and I am an Erasmus+ student at UPT this semester, enrolled in ${course}.

As I am not yet fluent in Romanian, could you kindly confirm:
${q1.replace("Termenul pentru predarea referatului rămâne", "Is the lab report deadline still").replace("Termenul pentru evaluare rămâne", "Is the assessment date still").replace("Care sunt termenele și condițiile de evaluare pentru acest laborator?", "What are the deadlines and assessment rules for this lab?")}
2. Would it be possible to take the assessment in English, or to receive the materials in English?

Thank you in advance for your understanding and support.

Kind regards,
[Your name]`;
  return { emailRo, emailEn };
}

export function analyzeLabOffline(text: string): LabAnalysis {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const deadlines: LabAnalysis["deadlines"] = [];
  for (const s of sentences) {
    for (const m of s.matchAll(
      /(\d{1,2})[./](\d{1,2})[./](\d{4})(?:,?\s*ora\s*(\d{1,2}[:.]\d{2}))?/g,
    )) {
      const date = `${m[1]?.padStart(2, "0")}.${m[2]?.padStart(2, "0")}.${m[3]}${m[4] ? ` ${m[4].replace(".", ":")}` : ""}`;
      deadlines.push({ date, label: deadlineLabel(s), detail: s });
    }
  }
  const grading: string[] = [];
  const pctParts = [...text.matchAll(/(\d{1,3})\s*%\s*([a-zăâîșț]+)/gi)].map((m) => {
    const word = (m[2] ?? "").toLowerCase();
    const en = word.startsWith("referat")
      ? "lab reports"
      : word.startsWith("colocviu")
        ? "lab exam"
        : word.startsWith("examen")
          ? "final exam"
          : word.startsWith("proiect")
            ? "project"
            : word.startsWith("tem")
              ? "assignments"
              : word;
    return `${m[1]}% ${en}`;
  });
  if (pctParts.length) grading.push(`Grade split: ${pctParts.join(" + ")}.`);
  const pen = text.match(/penalizeaz[ăa]\s+cu\s+(\d+)\s+punct\w*\s*\/\s*zi/i);
  if (pen) grading.push(`Late submissions lose ${pen[1]} point per day.`);
  if (/prezen[țt]a .*obligatorie/i.test(text)) grading.push("Attendance is mandatory.");
  const abs = text.match(/maximum\s+(\d+)\s+absen[țt]e/i);
  if (abs)
    grading.push(
      `Up to ${abs[1]} excused absences can be recovered${/s[ăa]pt[ăa]m[âa]na\s+(\d+)/i.test(text) ? ` in week ${text.match(/s[ăa]pt[ăa]m[âa]na\s+(\d+)/i)?.[1]}` : ""}.`,
    );
  const min = text.match(/nota\s+minim[ăa]\s+(\d+)/i);
  if (min)
    grading.push(`You need at least ${min[1]}/10 in the lab to be allowed into the final exam.`);

  const terms = GLOSSARY.filter(([re]) => re.test(text)).map(([, ro, en]) => ({ ro, en }));
  const courseTitle = extractCourse(text);
  const isExample = text.trim() === LAB_EXAMPLE.trim();
  const summary = isExample
    ? "Lab 5 of Operating Systems (3rd year, AC) covers process synchronization with semaphores and mutexes, held in room ASPC B418. Upload your lab report on cv.upt.ro by 4 Dec 2026, 23:59 — each late day costs 1 point. The lab exam (colocviu) is on 14 Jan 2027. Attendance is mandatory, and you must pass the lab (min. 5) to sit the final exam."
    : `This announcement for ${courseTitle} mentions ${deadlines.length} date${deadlines.length === 1 ? "" : "s"}${grading.length ? ` and ${grading.length} grading rule${grading.length === 1 ? "" : "s"}` : ""}. Turn on Live AI for a full English translation.`;
  const { emailRo, emailEn } = buildEmails(courseTitle, extractProfessor(text), deadlines[0]);
  return { courseTitle, summary, terms, deadlines, grading, emailRo, emailEn };
}
