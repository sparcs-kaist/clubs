import {
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

import type { ClubRegistrationRepository } from "../repository/club-registration.repository";
import { RegistrationService } from "./registration.service";

type Dependencies = ConstructorParameters<typeof RegistrationService>;

const previousSemester = { id: 8, year: 2026, name: "봄" };

const createContext = () => {
  const registrations = {
    getStudentRegistrationsClubRegistrationsMy: jest
      .fn()
      .mockResolvedValue({ registrations: [] }),
    getStudentPreviousClubRegistrations: jest.fn().mockResolvedValue([
      {
        id: 456,
        registrationApplicationStatusEnumId: RegistrationStatusEnum.Approved,
        registrationApplicationTypeEnumId: RegistrationTypeEnum.Renewal,
        clubId: 34,
        clubNameKr: "직전 동아리명",
        clubNameEn: "Previous club name",
        divisionId: 2,
        professorId: 3,
      },
    ]),
    hasPreviousClubRegistration: jest.fn().mockResolvedValue(true),
    getStudentRegistrationsClubRegistration: jest
      .fn()
      .mockResolvedValue({ activityPlanFile: { id: "plan-file" } }),
    findSemesterIdByRegistrationId: jest
      .fn()
      .mockResolvedValue(previousSemester.id),
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
    loadId: jest.fn().mockResolvedValue(9),
    findPrevious: jest.fn().mockResolvedValue(previousSemester),
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
    expect(semesters.findPrevious).not.toHaveBeenCalled();
    expect(clubs.findStudentDelegateClubIds).not.toHaveBeenCalled();
  });

  it("uses the same previous-semester scope for the list and detail", async () => {
    const { service, registrations, files } = createContext();

    await expect(
      service.getStudentRegistrationsClubRegistrationsMy(200, {
        semester: "previous",
      }),
    ).resolves.toMatchObject({
      semester: previousSemester,
      registrations: [
        {
          id: 456,
          clubId: 34,
          clubNameKr: "동아리",
          newClubNameKr: "직전 동아리명",
          divisionName: "분과",
          professorName: "교수",
        },
      ],
    });
    await expect(
      service.getStudentPreviousClubRegistration(200, 456),
    ).resolves.toEqual({
      semesterId: previousSemester.id,
      activityPlanFile: { id: "plan-file", url: "signed-url" },
    });

    const scope = {
      semesterId: previousSemester.id,
      delegateClubIds: [12, 34],
    };
    expect(
      registrations.getStudentPreviousClubRegistrations,
    ).toHaveBeenCalledWith(200, scope);
    expect(registrations.hasPreviousClubRegistration).toHaveBeenCalledWith(
      200,
      456,
      scope,
    );
    expect(files.getFileUrl).toHaveBeenCalledWith("plan-file");
  });

  it("denies an inaccessible registration before fetching detail or signing a file URL", async () => {
    const { service, registrations, files } = createContext();
    registrations.hasPreviousClubRegistration.mockResolvedValue(false);

    await expect(
      service.getStudentPreviousClubRegistration(200, 456),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      registrations.getStudentRegistrationsClubRegistration,
    ).not.toHaveBeenCalled();
    expect(files.getFileUrl).not.toHaveBeenCalled();
  });

  it("returns an empty list and no accessible detail when no previous semester exists", async () => {
    const { service, registrations, clubs, semesters } = createContext();
    semesters.findPrevious.mockResolvedValue(null);

    await expect(
      service.getStudentRegistrationsClubRegistrationsMy(200, {
        semester: "previous",
      }),
    ).resolves.toEqual({ registrations: [] });
    await expect(
      service.getStudentPreviousClubRegistration(200, 456),
    ).rejects.toMatchObject({ status: 404 });
    expect(clubs.findStudentDelegateClubIds).not.toHaveBeenCalled();
    expect(registrations.hasPreviousClubRegistration).not.toHaveBeenCalled();
  });
});
