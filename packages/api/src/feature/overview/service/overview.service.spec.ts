import { ClubTypeEnum } from "@clubs/domain/club/club-semester";

import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";
import { StudentEnum } from "@clubs/interface/common/enum/user.enum";

import { OverviewService } from "./overview.service";

jest.mock("@sparcs-clubs/api/common/util/logger", () => ({
  error: jest.fn(),
}));

jest.mock("@sparcs-clubs/api/prisma/prisma.service", () => ({
  PrismaService: class PrismaService {},
}));

jest.mock("@sparcs-clubs/api/feature/user/service/user.public.service", () => ({
  __esModule: true,
  default: class UserPublicService {},
}));

describe("OverviewService", () => {
  const baseQuery = {
    division: "식생활,대중문화,연주음악",
    year: 2024,
    semesterName: "봄",
    provisional: true,
    regular: true,
  };

  const createRepository = () => ({
    findClubsFundamentals: jest.fn().mockResolvedValue([
      {
        clubId: 4,
        district: "생활문화",
        division: "대중문화",
        clubNameKr: "가동아리",
        clubNameEn: "Provisional Club",
        clubStatus: ClubTypeEnum.Provisional,
      },
      {
        clubId: 3,
        district: "음악",
        division: "연주음악",
        clubNameKr: "정동아리3",
        clubNameEn: "Regular Club 3",
        clubStatus: ClubTypeEnum.Regular,
      },
      {
        clubId: 2,
        district: "생활문화",
        division: "대중문화",
        clubNameKr: "정동아리2",
        clubNameEn: "Regular Club 2",
        clubStatus: ClubTypeEnum.Regular,
      },
      {
        clubId: 1,
        district: "생활문화",
        division: "식생활",
        clubNameKr: "정동아리1",
        clubNameEn: "Regular Club 1",
        clubStatus: ClubTypeEnum.Regular,
      },
    ]),
    findDelegates: jest.fn().mockResolvedValue(
      [1, 2, 3, 4].map(clubId => ({
        clubId,
        delegateType: ClubDelegateEnum.Representative,
        name: `대표자${clubId}`,
        department: "전산학부",
        studentNumber: 20240000 + clubId,
        phoneNumber: null,
        kaistEmail: `representative${clubId}@kaist.ac.kr`,
      })),
    ),
    findClubs: jest.fn().mockResolvedValue([
      {
        clubId: 4,
        division: "대중문화",
        district: "생활문화",
        clubNameKr: "가동아리",
        clubNameEn: "Provisional Club",
        clubStatus: ClubTypeEnum.Provisional,
        characteristicKr: "",
        characteristicEn: "",
        advisor: "지도교수",
        foundingYear: 2024,
        clubBuildingEnum: 1,
        roomLocation: null,
        roomPassword: null,
        totalMemberCnt: 1n,
        semesterId: 15,
        approvedMemberStudentIds: [1],
      },
      {
        clubId: 3,
        division: "연주음악",
        district: "음악",
        clubNameKr: "정동아리3",
        clubNameEn: "Regular Club 3",
        clubStatus: ClubTypeEnum.Regular,
        characteristicKr: "",
        characteristicEn: "",
        advisor: "지도교수",
        foundingYear: 2024,
        clubBuildingEnum: 1,
        roomLocation: null,
        roomPassword: null,
        totalMemberCnt: 1n,
        semesterId: 15,
        approvedMemberStudentIds: [1],
      },
      {
        clubId: 2,
        division: "대중문화",
        district: "생활문화",
        clubNameKr: "정동아리2",
        clubNameEn: "Regular Club 2",
        clubStatus: ClubTypeEnum.Regular,
        characteristicKr: "",
        characteristicEn: "",
        advisor: "지도교수",
        foundingYear: 2024,
        clubBuildingEnum: 1,
        roomLocation: null,
        roomPassword: null,
        totalMemberCnt: 1n,
        semesterId: 15,
        approvedMemberStudentIds: [1],
      },
      {
        clubId: 1,
        division: "식생활",
        district: "생활문화",
        clubNameKr: "정동아리1",
        clubNameEn: "Regular Club 1",
        clubStatus: ClubTypeEnum.Regular,
        characteristicKr: "",
        characteristicEn: "",
        advisor: "지도교수",
        foundingYear: 2024,
        clubBuildingEnum: 1,
        roomLocation: null,
        roomPassword: null,
        totalMemberCnt: 1n,
        semesterId: 15,
        approvedMemberStudentIds: [1],
      },
    ]),
  });

  const createUserPublicService = () => ({
    getStudentEnumsByIdsAndSemesterId: jest
      .fn()
      .mockResolvedValue([{ id: 1, studentEnumId: StudentEnum.Undergraduate }]),
    fetchStudentSummaries: jest
      .fn()
      .mockResolvedValue([{ id: 1, studentNumber: "20240001" }]),
  });

  it("sorts delegate overview by club type, district, division, and Korean club name", async () => {
    const repository = createRepository();
    const service = new OverviewService(
      repository as never,
      createUserPublicService() as never,
    );

    await expect(
      service.getDelegateOverview({
        ...baseQuery,
        hasDelegate1: false,
        hasDelegate2: false,
      }),
    ).resolves.toMatchObject([
      { clubId: 2 },
      { clubId: 1 },
      { clubId: 3 },
      { clubId: 4 },
    ]);
  });

  it("sorts club info overview by club type, district, division, and Korean club name", async () => {
    const repository = createRepository();
    const service = new OverviewService(
      repository as never,
      createUserPublicService() as never,
    );

    await expect(service.getClubsOverview(baseQuery)).resolves.toMatchObject([
      { clubId: 2 },
      { clubId: 1 },
      { clubId: 3 },
      { clubId: 4 },
    ]);
  });

  it("excludes exchange students, graduate students and missing academic data from regular members without changing total members", async () => {
    const repository = createRepository();
    const [club] = await repository.findClubs();
    repository.findClubs.mockResolvedValue([
      {
        ...club,
        totalMemberCnt: 6n,
        approvedMemberStudentIds: [1, 2, 3, 4, 5, 6],
      },
    ]);
    const userPublicService = createUserPublicService();
    userPublicService.getStudentEnumsByIdsAndSemesterId.mockResolvedValue([
      { id: 1, studentEnumId: StudentEnum.Undergraduate },
      { id: 2, studentEnumId: StudentEnum.Undergraduate },
      { id: 3, studentEnumId: StudentEnum.Master },
      { id: 5, studentEnumId: StudentEnum.Undergraduate },
      { id: 6, studentEnumId: StudentEnum.Undergraduate },
    ]);
    userPublicService.fetchStudentSummaries.mockResolvedValue([
      { id: 1, studentNumber: "20240001" },
      { id: 2, studentNumber: "20248001" },
      { id: 3, studentNumber: "20242001" },
      { id: 4, studentNumber: "20240004" },
      { id: 6, studentNumber: "20240006" },
    ]);
    const service = new OverviewService(
      repository as never,
      userPublicService as never,
    );

    await expect(service.getClubsOverview(baseQuery)).resolves.toMatchObject([
      { totalMemberCnt: 6, regularMemberCnt: 2 },
    ]);
    expect(
      userPublicService.getStudentEnumsByIdsAndSemesterId,
    ).toHaveBeenCalledWith([1, 2, 3, 4, 5, 6], 15);
    expect(userPublicService.fetchStudentSummaries).toHaveBeenCalledWith([
      1, 2, 3, 4, 5, 6,
    ]);
  });

  it("returns no clubs without loading student data when the selected semester has no clubs", async () => {
    const repository = createRepository();
    repository.findClubs.mockResolvedValue([]);
    const userPublicService = createUserPublicService();
    const service = new OverviewService(
      repository as never,
      userPublicService as never,
    );

    await expect(service.getClubsOverview(baseQuery)).resolves.toEqual([]);
    expect(
      userPublicService.getStudentEnumsByIdsAndSemesterId,
    ).not.toHaveBeenCalled();
    expect(userPublicService.fetchStudentSummaries).not.toHaveBeenCalled();
  });
});
