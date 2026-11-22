import { Test, TestingModule } from "@nestjs/testing";

import apiOvv001 from "@clubs/interface/api/overview/endpoint/apiOvv001";
import apiUsr002 from "@clubs/interface/api/user/endpoint/apiUsr002";
import {
  ClubDelegateEnum,
  ClubTypeEnum,
} from "@clubs/interface/common/enum/club.enum";

import { CLOCK } from "@sparcs-clubs/api/common/clock/clock";
import { ClockModule } from "@sparcs-clubs/api/common/clock/clock.module";
import { TransactionModule } from "@sparcs-clubs/api/common/transaction/transaction.module";
import { OverviewController } from "@sparcs-clubs/api/feature/overview/controller/overview.controller";
import { OverviewModule } from "@sparcs-clubs/api/feature/overview/overview.module";
import { UserController } from "@sparcs-clubs/api/feature/user/controller/user.controller";
import { UserService } from "@sparcs-clubs/api/feature/user/service/user.service";
import { PrismaModule } from "@sparcs-clubs/api/prisma/prisma.module";
import { PrismaService } from "@sparcs-clubs/api/prisma/prisma.service";

import { clearDatabase, closeDatabase } from "./setup";

jest.mock("@sparcs-clubs/api/env", () => ({ env: { NODE_ENV: "test" } }));

jest.setTimeout(30_000);

const now = new Date("2026-11-23T06:00:00.000Z");
const startTerm = new Date("2026-09-01T00:00:00.000Z");
const endTerm = new Date("2026-12-31T00:00:00.000Z");
const year = 2026;
const semesterName = "Fall";
const divisionName = "연락처 검증 분과";

const slots = [
  {
    key: "representative",
    role: ClubDelegateEnum.Representative,
    phoneNumber: "010-1111-1111",
  },
  {
    key: "delegate1",
    role: ClubDelegateEnum.Delegate1,
    phoneNumber: "010-2222-2222",
  },
  {
    key: "delegate2",
    role: ClubDelegateEnum.Delegate2,
    phoneNumber: "010-3333-3333",
  },
] as const;

describe("current contacts across My page and the delegate overview", () => {
  let fixture: TestingModule;
  let prisma: PrismaService;
  let users: UserService;
  let userController: UserController;
  let overviewController: OverviewController;
  let clubId: number;
  let officers: Awaited<ReturnType<typeof seedOfficer>>[];

  beforeAll(async () => {
    fixture = await Test.createTestingModule({
      imports: [ClockModule, PrismaModule, TransactionModule, OverviewModule],
    })
      .overrideProvider(CLOCK)
      .useValue({ now: () => now })
      .compile();
    await fixture.init();
    prisma = fixture.get(PrismaService);
    users = fixture.get(UserService);
    userController = fixture.get(UserController);
    overviewController = fixture.get(OverviewController);
  });

  async function seedOfficer(slot: (typeof slots)[number]) {
    const name = `연락처 검증 임원 ${slot.role}`;
    const email = `contact-fixture-${slot.role}@kaist.ac.kr`;
    const sid = `contact-fixture-${slot.role}`;
    const account = await prisma.user.create({
      data: { sid, name },
      select: { id: true },
    });
    const number = 20260000 + slot.role;
    const student = await prisma.student.create({
      data: { userId: account.id, name, email, number },
      select: { id: true },
    });
    await prisma.clubDelegateD.create({
      data: {
        clubId,
        studentId: student.id,
        clubDelegateEnum: slot.role,
        startTerm,
      },
    });
    return { ...slot, account: { id: account.id, sid, name, email }, number };
  }

  beforeEach(async () => {
    await clearDatabase();
    const district = await prisma.district.create({
      data: { name: "연락처 검증 지구" },
    });
    const division = await prisma.division.create({
      data: { name: divisionName, districtId: district.id },
    });
    const club = await prisma.club.create({
      data: {
        nameKr: "연락처 검증 동아리",
        nameEn: "Contact Fixture Club",
        foundingYear: 2020,
        divisionId: division.id,
      },
    });
    clubId = club.id;
    const semester = await prisma.semesterD.create({
      data: { year, name: semesterName, startTerm, endTerm },
    });
    await prisma.clubT.create({
      data: {
        clubId,
        semesterId: semester.id,
        clubStatusEnumId: ClubTypeEnum.Regular,
        startTerm,
        endTerm,
      },
    });
    officers = await Promise.all(slots.map(seedOfficer));
  });

  afterAll(async () => {
    await fixture?.close();
    await closeDatabase();
  });

  async function getOverview() {
    const result = await overviewController.getDelegateOverveiw({
      year,
      semesterName,
      division: divisionName,
      regular: true,
      provisional: false,
      hasDelegate1: true,
      hasDelegate2: true,
    });
    const rows = apiOvv001.responseBodyMap[200].parse(result);
    expect(rows).toHaveLength(1);
    return rows[0];
  }

  async function readMyPhone(userId: number) {
    const result = await users.getUserPhoneNumber(userId);
    return apiUsr002.responseBodyMap[200].parse(result).phoneNumber;
  }

  it("shows a newly saved number in My page and the matching overview slot for each officer", async () => {
    const before = await getOverview();
    await Promise.all(
      officers.map(async officer => {
        expect(await readMyPhone(officer.account.id)).toBeNull();
        expect(before[officer.key]?.phoneNumber).toBeNull();
        await userController.updatePhoneNumber(officer.account, {
          profile: "undergraduate",
          phoneNumber: officer.phoneNumber,
        });
      }),
    );

    const overview = await getOverview();
    await Promise.all(
      officers.map(async officer => {
        const myPhone = await readMyPhone(officer.account.id);
        expect(myPhone).toBe(officer.phoneNumber);
        expect(overview[officer.key]).toMatchObject({
          delegateType: officer.role,
          studentNumber: officer.number,
          phoneNumber: myPhone,
          kaistEmail: officer.account.email,
        });
      }),
    );
  });

  it("formats the same legacy mobile number in both reads without updating it", async () => {
    const [representative] = officers;
    const { id } = representative.account;
    const legacy = "01012345678";
    await prisma.user.update({ where: { id }, data: { phoneNumber: legacy } });

    expect(await readMyPhone(id)).toBe("010-1234-5678");
    expect((await getOverview()).representative.phoneNumber).toBe(
      "010-1234-5678",
    );
    expect(await prisma.user.findUnique({ where: { id } })).toMatchObject({
      phoneNumber: legacy,
    });
  });
});
