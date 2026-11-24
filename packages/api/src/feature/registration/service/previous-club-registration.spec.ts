import {
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

import type { ClubRegistrationRepository } from "../repository/club-registration.repository";
import { RegistrationService } from "./registration.service";

type Dependencies = ConstructorParameters<typeof RegistrationService>;

const currentSemester = { id: 9, year: 2026, name: "가을" };
const previousSemester = { id: 8, year: 2026, name: "봄" };
const olderSemester = { id: 11, year: 2025, name: "봄" };
const emptySemester = { id: 7, year: 2025, name: "가을" };
const registration = {
  id: 456,
  semesterId: previousSemester.id,
  registrationApplicationStatusEnumId: RegistrationStatusEnum.Approved,
  registrationApplicationTypeEnumId: RegistrationTypeEnum.Renewal,
  clubId: 34,
  clubNameKr: "직전 동아리명",
  clubNameEn: "Previous club name",
  divisionId: 2,
  professorId: 3,
};

const createContext = () => {
  const registrations = {
    getStudentRegistrationsClubRegistrationsMy: jest
      .fn()
      .mockResolvedValue({ registrations: [] }),
    getReadableClubRegistrations: jest
      .fn()
      .mockResolvedValue([
        { ...registration, id: 457, semesterId: olderSemester.id },
        registration,
      ]),
    hasReadableClubRegistration: jest.fn().mockResolvedValue(true),
    getStudentRegistrationsClubRegistration: jest
      .fn()
      .mockResolvedValue({ activityPlanFile: { id: "plan-file" } }),
    findSemesterIdByRegistrationId: jest
      .fn()
      .mockResolvedValue(olderSemester.id),
  };
  const clubs = {
    findStudentDelegateClubIds: jest.fn().mockResolvedValue([12, 34]),
    findClubsByIds: jest.fn().mockResolvedValue([{ id: 34, nameKr: "동아리" }]),
  };
  const divisions = {
    findDivisionsByIds: jest.fn().mockResolvedValue([{ id: 2, name: "분과" }]),
  };
  const users = {
    findProfessorNamesByIds: jest
      .fn()
      .mockResolvedValue([{ id: 3, name: "교수" }]),
  };
  const semesters = {
    loadId: jest.fn().mockResolvedValue(currentSemester.id),
    load: jest.fn().mockResolvedValue(currentSemester),
    findPreviousSemesters: jest
      .fn()
      .mockResolvedValue([previousSemester, emptySemester, olderSemester]),
  };
  const files = { getFileUrl: jest.fn().mockResolvedValue("signed-url") };
  const service = new RegistrationService(
    registrations as unknown as ClubRegistrationRepository,
    clubs as unknown as Dependencies[1],
    divisions as unknown as Dependencies[2],
    files as unknown as Dependencies[3],
    {} as Dependencies[4],
    users as unknown as Dependencies[5],
    {} as Dependencies[6],
    semesters as unknown as Dependencies[7],
    {} as Dependencies[8],
    {} as Dependencies[9],
  );
  return { service, registrations, clubs, semesters, files };
};

describe("previous-semester club registration", () => {
  it("keeps the existing default list scoped to the student's current semester", async () => {
    const { service, registrations, clubs, semesters } = createContext();

    await service.getStudentRegistrationsClubRegistrationsMy(200);

    expect(
      registrations.getStudentRegistrationsClubRegistrationsMy,
    ).toHaveBeenCalledWith(200, 9);
    expect(semesters.findPreviousSemesters).not.toHaveBeenCalled();
    expect(clubs.findStudentDelegateClubIds).not.toHaveBeenCalled();
  });

  it("lists all readable semesters chronologically and supports older details", async () => {
    const { service, registrations, files } = createContext();

    await expect(
      service.getStudentRegistrationsClubRegistrationsMy(200, {
        semester: "previous",
      }),
    ).resolves.toMatchObject({
      semester: previousSemester,
      semesters: [previousSemester, olderSemester],
      registrations: [
        {
          id: 456,
          semesterId: previousSemester.id,
          clubId: 34,
          clubNameKr: "동아리",
          newClubNameKr: "직전 동아리명",
          divisionName: "분과",
          professorName: "교수",
        },
        { id: 457, semesterId: olderSemester.id },
      ],
    });
    await expect(
      service.getStudentPreviousClubRegistration(200, 457),
    ).resolves.toEqual({
      semesterId: olderSemester.id,
      activityPlanFile: { id: "plan-file", url: "signed-url" },
    });

    const semesterIds = [
      previousSemester.id,
      emptySemester.id,
      olderSemester.id,
    ];
    const reader = {
      studentId: 200,
      delegateClubIds: [12, 34],
    };
    expect(registrations.getReadableClubRegistrations).toHaveBeenCalledWith(
      semesterIds,
      reader,
    );
    expect(registrations.hasReadableClubRegistration).toHaveBeenCalledWith(
      457,
      semesterIds,
      reader,
    );
    expect(files.getFileUrl).toHaveBeenCalledWith("plan-file");
  });

  it("denies an inaccessible registration before fetching detail or signing a file URL", async () => {
    const { service, registrations, files } = createContext();
    registrations.hasReadableClubRegistration.mockResolvedValue(false);

    await expect(
      service.getStudentPreviousClubRegistration(200, 456),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      registrations.getStudentRegistrationsClubRegistration,
    ).not.toHaveBeenCalled();
    expect(files.getFileUrl).not.toHaveBeenCalled();
  });

  it("returns an empty list and no accessible detail when no previous semester exists", async () => {
    const { service, registrations, semesters } = createContext();
    semesters.findPreviousSemesters.mockResolvedValue([]);

    await expect(
      service.getStudentRegistrationsClubRegistrationsMy(200, {
        semester: "previous",
      }),
    ).resolves.toEqual({ registrations: [], semesters: [] });
    await expect(
      service.getStudentPreviousClubRegistration(200, 456),
    ).rejects.toMatchObject({ status: 404 });
    expect(registrations.getReadableClubRegistrations).not.toHaveBeenCalled();
    expect(registrations.hasReadableClubRegistration).not.toHaveBeenCalled();
  });

  it("lists this semester's submitted applications for the managed club", async () => {
    const { service, registrations, semesters } = createContext();
    registrations.getReadableClubRegistrations.mockResolvedValue([
      { ...registration, semesterId: currentSemester.id },
    ]);

    await expect(
      service.getStudentRegistrationsClubRegistrationsMy(200, { clubId: 34 }),
    ).resolves.toMatchObject({
      semester: currentSemester,
      registrations: [{ id: 456, semesterId: currentSemester.id }],
    });
    expect(registrations.getReadableClubRegistrations).toHaveBeenCalledWith(
      [currentSemester.id],
      { clubId: 34 },
    );
    expect(semesters.findPreviousSemesters).not.toHaveBeenCalled();
  });

  it("uses only the selected club for managed history", async () => {
    const { service, registrations } = createContext();

    await service.getStudentRegistrationsClubRegistrationsMy(200, {
      clubId: 34,
      semester: "previous",
    });
    expect(registrations.getReadableClubRegistrations).toHaveBeenCalledWith(
      [previousSemester.id, emptySemester.id, olderSemester.id],
      { clubId: 34 },
    );
  });

  it.each([{}, { semester: "previous" } as const])(
    "rejects a club the student does not manage with query %o",
    async query => {
      const { service, registrations } = createContext();

      await expect(
        service.getStudentRegistrationsClubRegistrationsMy(200, {
          ...query,
          clubId: 99,
        }),
      ).rejects.toMatchObject({ status: 404 });
      expect(registrations.getReadableClubRegistrations).not.toHaveBeenCalled();
    },
  );
});
