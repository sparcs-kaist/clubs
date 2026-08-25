import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";

import { RegistrationService } from "./registration.service";

jest.mock("@nestjs-cls/transactional", () => ({
  Transactional: () => () => undefined,
}));

type RegistrationServiceDependencies = ConstructorParameters<
  typeof RegistrationService
>;

const clubId = 201;
const studentId = 301;
const semesterId = 7;

const createService = (clubTypeEnum: ClubTypeEnum) => {
  const clubPublicService = {
    getClubByClubId: jest.fn().mockResolvedValue([{ id: clubId }]),
    getClubSummariesByClubIdAndSemesterIds: jest.fn().mockResolvedValue([
      {
        id: clubId,
        typeEnum: clubTypeEnum,
      },
    ]),
    isStudentBelongsTo: jest.fn().mockResolvedValue(false),
  };
  const userPublicService = {
    isNotGraduateStudent: jest.fn().mockResolvedValue(true),
  };
  const memberRegistrationRepository = {
    find: jest.fn().mockResolvedValue([]),
    createPending: jest.fn().mockResolvedValue(undefined),
  };
  const semesterPublicService = {
    loadId: jest.fn().mockResolvedValue(semesterId),
  };
  const registrationDeadlinePublicService = {
    validate: jest.fn().mockResolvedValue(undefined),
  };
  const service = new RegistrationService(
    {} as RegistrationServiceDependencies[0],
    clubPublicService as RegistrationServiceDependencies[1],
    {} as RegistrationServiceDependencies[2],
    {} as RegistrationServiceDependencies[3],
    {} as RegistrationServiceDependencies[4],
    userPublicService as RegistrationServiceDependencies[5],
    memberRegistrationRepository as RegistrationServiceDependencies[6],
    semesterPublicService as RegistrationServiceDependencies[7],
    registrationDeadlinePublicService as RegistrationServiceDependencies[8],
  );

  return { service, memberRegistrationRepository };
};

describe("RegistrationService member registration availability", () => {
  it.each([ClubTypeEnum.Regular, ClubTypeEnum.Provisional])(
    "allows member registration for active club type %i",
    async clubTypeEnum => {
      const { service, memberRegistrationRepository } =
        createService(clubTypeEnum);

      await service.postMemberRegistration(studentId, clubId);

      expect(memberRegistrationRepository.createPending).toHaveBeenCalledWith(
        studentId,
        clubId,
        semesterId,
      );
    },
  );

  it("rejects member registration for a registration-canceled club", async () => {
    const { service, memberRegistrationRepository } = createService(
      ClubTypeEnum.RegistrationCanceled,
    );

    await expect(
      service.postMemberRegistration(studentId, clubId),
    ).rejects.toThrow("The club is not operating in the current semester.");
    expect(memberRegistrationRepository.createPending).not.toHaveBeenCalled();
  });
});
