import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getProfessorPendingApprovals } from "./getProfessorPendingApprovals.ts";

const registration = {
  id: 10,
  clubId: 1,
  newClubNameKr: "가나다",
  semesterId: 4,
  professorSignedAt: null,
};

describe("professor pending approvals", () => {
  it("groups approvable reports and current-semester registrations by club", () => {
    assert.deepEqual(
      getProfessorPendingApprovals(
        4,
        [
          {
            id: 1,
            nameKr: "가나다",
            activities: [
              { canProfessorApprove: true },
              { canProfessorApprove: false },
              { canProfessorApprove: true },
            ],
          },
        ],
        [registration, { ...registration, id: 11 }],
      ),
      [
        {
          clubId: 1,
          clubName: "가나다",
          activityCount: 2,
          registrationIds: [10, 11],
        },
      ],
    );
  });

  it("excludes ineligible reports and registrations outside the current semester or already signed", () => {
    assert.deepEqual(
      getProfessorPendingApprovals(
        4,
        [
          {
            id: 1,
            nameKr: "가나다",
            activities: [{ canProfessorApprove: false }],
          },
        ],
        [
          { ...registration, semesterId: 3 },
          { ...registration, semesterId: null },
          { ...registration, professorSignedAt: new Date() },
        ],
      ),
      [],
    );
  });

  it("includes new clubs without a managed relationship and sorts by name then ID", () => {
    assert.deepEqual(
      getProfessorPendingApprovals(
        4,
        [],
        [
          { ...registration, clubId: 3, newClubNameKr: "나다라" },
          { ...registration, clubId: 2 },
          registration,
        ],
      ).map(club => club.clubId),
      [1, 2, 3],
    );
    assert.deepEqual(getProfessorPendingApprovals(4, [], []), []);
  });
});
