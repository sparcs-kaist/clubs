import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

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
  };
  const semesterPublicService = {
    loadId: jest.fn().mockResolvedValue(semesterId),
  };
  const registrationDeadlinePublicService = {
    validate: jest.fn().mockResolvedValue(undefined),
  };
  const registrationApplicationStudent = {
    create: jest.fn().mockResolvedValue({ id: 1 }),
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
    {
      tx: { registrationApplicationStudent },
    } as unknown as RegistrationServiceDependencies[9],
  );

  return { service, registrationApplicationStudent };
};

describe("RegistrationService member registration availability", () => {
  it.each([ClubTypeEnum.Regular, ClubTypeEnum.Provisional])(
    "allows member registration for active club type %i",
    async clubTypeEnum => {
      const { service, registrationApplicationStudent } =
        createService(clubTypeEnum);

      await service.postMemberRegistration(studentId, clubId);

      expect(registrationApplicationStudent.create).toHaveBeenCalledWith({
        data: {
          studentId,
          clubId,
          semesterId,
          registrationApplicationStudentEnum:
            RegistrationApplicationStudentStatusEnum.Pending,
        },
      });
    },
  );

  it("rejects member registration for a registration-canceled club", async () => {
    const { service, registrationApplicationStudent } = createService(
      ClubTypeEnum.RegistrationCanceled,
    );

    await expect(
      service.postMemberRegistration(studentId, clubId),
    ).rejects.toThrow("The club is not operating in the current semester.");
    expect(registrationApplicationStudent.create).not.toHaveBeenCalled();
  });
});
