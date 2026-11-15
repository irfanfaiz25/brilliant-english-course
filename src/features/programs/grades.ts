import { fillTemplate } from "@/lib/template";

import { schoolGrades, type SchoolGrade } from "./schema";

/*
 * School-year spans of program classes (ADR-040), e.g. "TK – SD kelas 1" or "SD kelas 3–4".
 * Pure: the labels are plain templates, so server pages and client previews format alike.
 */

/** Plain templates of the `Grades` messages (`t.raw`). */
export type GradeLabels = {
  tk: string;
  sd: string;
  smp: string;
  sdRange: string;
  smpRange: string;
  span: string;
};

export const gradeLabelKeys = [
  "tk",
  "sd",
  "smp",
  "sdRange",
  "smpRange",
  "span",
] as const satisfies readonly (keyof GradeLabels)[];

type Stage = "tk" | "sd" | "smp";

function stageOf(grade: SchoolGrade): Stage {
  if (grade === "tk") return "tk";
  return grade.startsWith("smp") ? "smp" : "sd";
}

/** The year within its stage: `sd3` → 3, `smp1` → 1 (TK has none). */
const yearOf = (grade: SchoolGrade) => Number(grade.replace(/\D/g, "")) || 0;

/** One school year: "TK", "SD kelas 3", "SMP kelas 1". */
export function formatGrade(grade: SchoolGrade, labels: GradeLabels): string {
  const stage = stageOf(grade);
  return stage === "tk" ? labels.tk : fillTemplate(labels[stage], { number: yearOf(grade) });
}

/** A span of school years, joined within a stage ("SD kelas 1–3") or across ("TK – SD kelas 1"). */
export function formatGradeSpan(from: SchoolGrade, to: SchoolGrade, labels: GradeLabels): string {
  if (from === to) return formatGrade(from, labels);
  const stage = stageOf(from);
  if (stage === stageOf(to) && stage !== "tk") {
    return fillTemplate(labels[stage === "sd" ? "sdRange" : "smpRange"], {
      from: yearOf(from),
      to: yearOf(to),
    });
  }
  return fillTemplate(labels.span, {
    from: formatGrade(from, labels),
    to: formatGrade(to, labels),
  });
}

/** The whole span a level's classes cover (earliest start to latest end), or `null` without classes. */
export function gradeSpanOf(
  classes: readonly { gradeFrom: SchoolGrade; gradeTo: SchoolGrade }[],
): { from: SchoolGrade; to: SchoolGrade } | null {
  if (classes.length === 0) return null;
  const index = (grade: SchoolGrade) => schoolGrades.indexOf(grade);
  const from = Math.min(...classes.map((item) => index(item.gradeFrom)));
  const to = Math.max(...classes.map((item) => index(item.gradeTo)));
  // Both indexes come from `schoolGrades` itself.
  return { from: schoolGrades[from] as SchoolGrade, to: schoolGrades[to] as SchoolGrade };
}
