import { ClubTypeEnum } from "@clubs/domain/club/club-semester";

import { ClubDelegateEnum } from "@clubs/interface/common/enum/club.enum";

import { OverviewService } from "./overview.service";

jest.mock("@sparcs-clubs/api/common/util/logger", () => ({
  error: jest.fn(),
}));

jest.mock("@sparcs-clubs/api/prisma/prisma.service", () => ({
  PrismaService: class PrismaService {},
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
        regularMemberCnt: 1n,
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
        regularMemberCnt: 1n,
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
        regularMemberCnt: 1n,
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
        regularMemberCnt: 1n,
      },
    ]),
  });

  it("sorts delegate overview by club type, district, division, and Korean club name", async () => {
    const repository = createRepository();
    const service = new OverviewService(repository as never);

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
    const service = new OverviewService(repository as never);

    await expect(service.getClubsOverview(baseQuery)).resolves.toMatchObject([
      { clubId: 2 },
      { clubId: 1 },
      { clubId: 3 },
      { clubId: 4 },
    ]);
  });
});
