import { describe, expect, it } from "vitest";

import { levelFixtures } from "@/db/seed/content/programs";

import { formatGrade, formatGradeSpan, gradeSpanOf, type GradeLabels } from "./grades";
import { levelFormSchema, type LevelFormInput } from "./schema";

const id: GradeLabels = {
  tk: "TK",
  sd: "SD kelas {number}",
  smp: "SMP kelas {number}",
  sdRange: "SD kelas {from}–{to}",
  smpRange: "SMP kelas {from}–{to}",
  span: "{from} – {to}",
};

describe("school-year labels", () => {
  it("names one school year", () => {
    expect(formatGrade("tk", id)).toBe("TK");
    expect(formatGrade("sd3", id)).toBe("SD kelas 3");
    expect(formatGrade("smp1", id)).toBe("SMP kelas 1");
  });

  it("joins a span within a stage and across stages", () => {
    expect(formatGradeSpan("sd1", "sd3", id)).toBe("SD kelas 1–3");
    expect(formatGradeSpan("smp3", "smp3", id)).toBe("SMP kelas 3");
    expect(formatGradeSpan("tk", "sd1", id)).toBe("TK – SD kelas 1");
    expect(formatGradeSpan("sd6", "smp1", id)).toBe("SD kelas 6 – SMP kelas 1");
  });

  it("covers a level from its earliest to its latest class", () => {
    const [kindy, elementary] = levelFixtures.id;
    expect(gradeSpanOf(kindy?.classes ?? [])).toEqual({ from: "tk", to: "sd3" });
    expect(gradeSpanOf(elementary?.classes ?? [])).toEqual({ from: "sd1", to: "sd6" });
    expect(gradeSpanOf([])).toBeNull();
  });
});

describe("level form classes", () => {
  const fixture = levelFixtures.id[0];
  if (!fixture) throw new Error("Missing level fixture");
  const text = {
    name: fixture.name,
    tagline: fixture.tagline,
    summary: fixture.summary,
    skills: fixture.skills.map((value) => ({ value })),
    description: fixture.description,
    curriculum: fixture.curriculum.map((value) => ({ value })),
    imageAlt: fixture.image.alt,
  };
  const row = (name: string, gradeFrom = "sd1", gradeTo = "sd2") => ({
    classId: "",
    name,
    gradeFrom,
    gradeTo,
    focus: { id: "", en: "" },
  });
  const level = (classes: unknown[]) =>
    ({
      theme: "sunny",
      inAgeFinder: true,
      ageMin: 4,
      ageMax: 6,
      sessionsPerWeek: 2,
      maxStudentsPerClass: 10,
      imageId: "8f14e45f-ceea-4672-8b67-6d1b1c5f8c11",
      isPublished: true,
      texts: { id: text, en: text },
      classes,
    }) as LevelFormInput;
  const errorsOf = (input: unknown) => {
    const result = levelFormSchema.safeParse(input);
    return result.success
      ? {}
      : Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
  };

  it("accepts overlapping spans, empty focus lines and no classes at all", () => {
    expect(errorsOf(level([row("Smart Kindy 2", "sd1", "sd3"), row("Smart Kindy 3")]))).toEqual({});
    expect(errorsOf(level([]))).toEqual({});
  });

  it("refuses a span that ends before it starts, on the end field", () => {
    expect(errorsOf(level([row("Intro 1", "sd4", "sd3")]))).toEqual({
      "classes.0.gradeTo": "gradeRange",
    });
  });

  it("refuses the same name twice in one level, on the second row", () => {
    expect(errorsOf(level([row("Basic"), row(" basic ")]))).toEqual({
      "classes.1.name": "classNameTaken",
    });
  });
});
