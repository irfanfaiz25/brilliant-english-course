import { describe, expect, it } from "vitest";

import { isOpenLeadStatus, leadNoteSchema, leadStatuses, leadUpdateSchema } from "./schema";

const ID = "8f14e45f-ceea-4672-8b67-6d1b1c5f8c11";

describe("lead pipeline schemas", () => {
  it("splits the statuses into open and closed", () => {
    expect(leadStatuses.filter(isOpenLeadStatus)).toEqual([
      "new",
      "contacted",
      "qualified",
      "onboarding",
    ]);
  });

  it("accepts no assignee and an empty note", () => {
    expect(
      leadUpdateSchema.parse({ id: ID, status: "contacted", assignedToId: "", note: "  " }),
    ).toEqual({ id: ID, status: "contacted", assignedToId: "", note: "" });
  });

  it("rejects unknown statuses and too short notes", () => {
    expect(
      leadUpdateSchema.safeParse({ id: ID, status: "won", assignedToId: "", note: "" }).success,
    ).toBe(false);
    expect(leadNoteSchema.safeParse({ id: ID, body: "x" }).error?.issues[0]?.message).toBe(
      "tooShort:2",
    );
  });
});
