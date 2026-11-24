import { StudentRepository } from "@sparcs-clubs/api/feature/user/repository/student.repository";

import { ClubRepository } from "./club.repository";
import { lockClubDelegates } from "./lock-club-delegates";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

describe("lockClubDelegates", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each<{
    studentId?: number;
    additionalStudentId?: number;
    expected: number[];
  }>([
    { expected: [] },
    { studentId: 10, expected: [10] },
    { additionalStudentId: 10, expected: [10] },
    { studentId: 20, additionalStudentId: 10, expected: [10, 20] },
    { studentId: 10, additionalStudentId: 20, expected: [10, 20] },
    { studentId: 10, additionalStudentId: 10, expected: [10] },
  ])(
    "locks the club before students $expected",
    async ({ studentId, additionalStudentId, expected }) => {
      const locks: string[] = [];
      jest
        .spyOn(ClubRepository.prototype, "acquireLock")
        .mockImplementation(async (_tx, query) => {
          locks.push(`club:${query.id}`);
        });
      jest
        .spyOn(StudentRepository.prototype, "acquireLock")
        .mockImplementation(async (_tx, query) => {
          locks.push(`student:${query.id}`);
        });

      await lockClubDelegates(
        { tx: {} } as never,
        42,
        studentId,
        additionalStudentId,
      );

      expect(locks).toEqual([
        "club:42",
        ...expected.map(id => `student:${id}`),
      ]);
    },
  );
});
