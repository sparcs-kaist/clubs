import {
  IdentitySyncDiagnostic,
  UserIdentitySyncError,
} from "../model/login-identity";
import { UserLoginIdentityRepository } from "../repository/login-identity/user-login-identity.repository";
import { UserLoginIdentityService } from "./user-login-identity.service";

jest.mock("@nestjs-cls/transactional", () => ({
  ...jest.requireActual("@nestjs-cls/transactional"),
  Transactional: () => () => undefined,
}));

jest.mock("@sparcs-clubs/api/prisma/prisma.service", () => ({
  PrismaService: class PrismaService {},
}));

describe("UserLoginIdentityService legacy login behavior", () => {
  const currentDate = new Date("2026-06-10T00:00:00.000Z");
  const mockUserId = 900001;
  const mockStudentId = 900002;
  const mockSid = "test-sid";
  const mockStudentName = "테스트 학생";
  const defaultStudentNumber = 20995042;

  const createRepository = ({
    studentNumber = defaultStudentNumber,
    studentTerms = [
      {
        studentId: mockStudentId,
        studentEnum: 3,
      },
    ],
  }: {
    studentNumber?: number;
    studentTerms?: { studentId: number; studentEnum: number }[];
  } = {}) => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      user: {
        upsert: jest.fn().mockResolvedValue({ id: mockUserId }),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([
          {
            id: mockUserId,
            sid: mockSid,
            name: mockStudentName,
            email: "test-student@example.com",
          },
        ]),
      },
      semesterD: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 19,
            startTerm: new Date("2026-03-01T00:00:00.000Z"),
            endTerm: new Date("2026-08-31T23:59:59.000Z"),
          },
        ]),
      },
      student: {
        upsert: jest.fn().mockResolvedValue({ id: mockStudentId }),
        update: jest.fn(),
        findMany: jest
          .fn()
          .mockResolvedValueOnce([
            {
              id: mockStudentId,
              number: studentNumber,
            },
          ])
          .mockResolvedValue([
            {
              id: mockStudentId,
              number: studentNumber,
            },
          ]),
      },
      studentT: {
        upsert: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue(studentTerms),
      },
      executive: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      professor: {
        upsert: jest.fn().mockResolvedValue({ id: 2 }),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      professorT: {
        upsert: jest.fn().mockResolvedValue({ id: 3 }),
        update: jest.fn(),
      },
      employee: {
        create: jest.fn().mockResolvedValue({ id: 4 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      employeeT: {
        upsert: jest.fn().mockResolvedValue({ id: 5 }),
        update: jest.fn(),
      },
    };

    const txHost = { tx: prisma } as never;
    const service = new UserLoginIdentityService(
      new UserLoginIdentityRepository(txHost),
    );
    const semester = {
      id: 19,
      startTerm: new Date("2026-03-01T00:00:00.000Z"),
      endTerm: new Date("2026-08-31T23:59:59.000Z"),
    };
    // Keep the previous repository's regression cases while exercising the new public contract.
    const repository = {
      findUserById: (userId: number) => service.findLoginIdentity(userId),
      async findOrCreateUser(
        email: string,
        number: string,
        sid: string,
        name: string,
        type: string,
        department: string,
        typeV2: string,
        statusV2: string | null,
        progCodeV2: string | null,
        diagnostic?: IdentitySyncDiagnostic,
      ) {
        try {
          const synced = await service.syncSsoIdentity(
            {
              email,
              studentNumber: number,
              sid,
              name,
              type,
              department,
              typeV2,
              statusV2,
              progCodeV2,
            },
            semester,
          );
          if (diagnostic) Object.assign(diagnostic, synced.diagnostic);
          return synced.identity;
        } catch (error) {
          if (!(error instanceof UserIdentitySyncError)) throw error;
          if (diagnostic) Object.assign(diagnostic, error.diagnostic);
          throw error.cause;
        }
      },
    };
    const clock = { now: jest.fn().mockReturnValue(currentDate) };
    Object.defineProperty(service, "clock", { value: clock });

    return { repository, service, prisma, clock, semester };
  };

  it("exposes the original failure and final snapshot without importing Auth", async () => {
    const { service, prisma, semester } = createRepository();
    const cause = new Error("student query failed");
    prisma.studentT.findMany.mockRejectedValueOnce(cause);
    const failure = await service
      .syncSsoIdentity(
        {
          email: "student@example.com",
          studentNumber: "20992001",
          sid: mockSid,
          name: mockStudentName,
          type: "Student",
          department: "1234",
          typeV2: "S",
          statusV2: "재학",
          progCodeV2: "1",
        },
        semester,
      )
      .catch(error => error);
    expect(failure).toBeInstanceOf(UserIdentitySyncError);
    expect(failure.cause).toBe(cause);
    expect(failure.diagnostic).toMatchObject({
      stage: "db.current-degree.read",
      userId: mockUserId,
      studentId: mockStudentId,
    });
    expect(failure.diagnostic.db.currentStudentTerms).not.toHaveProperty(
      "rows",
    );
  });

  it("returns false for a missing active user", async () => {
    const { service, prisma } = createRepository();
    await expect(service.isActiveUser(mockUserId)).resolves.toBe(true);
    prisma.user.findMany.mockResolvedValueOnce([]);
    await expect(service.isActiveUser(mockUserId)).resolves.toBe(false);
  });

  it("synchronizes professor and employee identities through their existing keys", async () => {
    const { service, prisma, semester } = createRepository();
    prisma.professor.findMany.mockResolvedValue([{ id: 31 }]);
    prisma.employee.findMany.mockResolvedValue([{ id: 41 }]);
    const { identity } = await service.syncSsoIdentity(
      {
        email: "staff@example.com",
        studentNumber: "",
        sid: mockSid,
        name: "Staff",
        type: "Employee",
        department: "100",
        typeV2: "P",
        statusV2: null,
        progCodeV2: null,
      },
      semester,
    );
    expect(identity.professor).toEqual({ id: 31 });
    expect(identity.employee).toEqual({ id: 41 });
    expect(prisma.professorT.upsert.mock.calls[0][0].create).toEqual({
      professorId: 31,
      department: 100,
      startTerm: semester.startTerm,
      professorEnum: 3,
    });
    expect(prisma.employeeT.upsert.mock.calls[0][0].create).toEqual({
      employeeId: 41,
      startTerm: semester.startTerm,
    });
    expect(prisma.student.upsert).not.toHaveBeenCalled();
  });

  it("retains the token-refresh role lookup's existing filters and optional email fields", async () => {
    const { service, prisma } = createRepository();
    prisma.student.findMany.mockReset().mockResolvedValueOnce([]);
    prisma.executive.findMany.mockResolvedValueOnce([
      { id: 21, studentId: mockStudentId },
    ]);
    prisma.professor.findMany.mockResolvedValueOnce([
      { id: 31, email: "professor@example.com" },
    ]);
    prisma.employee.findMany.mockResolvedValueOnce([
      { id: 41, email: "employee@example.com" },
    ]);
    const identity = await service.findLoginIdentity(mockUserId);
    expect(identity).toMatchObject({
      executive: { id: 21, studentId: mockStudentId },
      professor: { id: 31, email: "professor@example.com" },
      employee: { id: 41, email: "employee@example.com" },
    });
    expect(prisma.studentT.findMany).not.toHaveBeenCalled();
    expect(prisma.executive.findMany).toHaveBeenCalledWith({
      where: { userId: mockUserId, deletedAt: null },
    });
  });

  it.each([
    ["0", 1, "undergraduate"],
    ["1", 2, "master"],
    ["3", 2, "master"],
    ["4", 2, "master"],
    ["5", 3, "doctor"],
    ["7", 4, "masterDoctorDoctor"],
    ["8", 5, "masterDoctorMaster"],
    ["9", 6, "allPrograms"],
    ["10", 7, "auditor"],
  ] as const)(
    "creates the first term and profile for string SSO program %s",
    async (progCodeV2, studentEnum, profileKey) => {
      const studentNumber = 20998083;
      const { service, prisma, semester } = createRepository({
        studentNumber,
        studentTerms: [],
      });
      prisma.studentT.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ studentId: mockStudentId, studentEnum }]);
      const { identity } = await service.syncSsoIdentity(
        {
          email: "student@example.com",
          studentNumber: studentNumber.toString(),
          sid: mockSid,
          name: mockStudentName,
          type: "Student",
          department: "",
          typeV2: "S",
          statusV2: null,
          progCodeV2,
        },
        semester,
      );
      expect(prisma.studentT.upsert.mock.calls[0][0].create.studentEnum).toBe(
        studentEnum,
      );
      expect(identity).toEqual({
        id: mockUserId,
        sid: mockSid,
        name: mockStudentName,
        email: "test-student@example.com",
        [profileKey]: { id: mockStudentId, number: studentNumber },
      });
    },
  );

  it.each([
    0,
    1,
    2,
    3,
    4,
    5,
    7,
    8,
    9,
    10,
    null,
    undefined,
    "2",
    "6",
    "11",
    "01",
    "1 ",
    "07",
    "7 ",
    "10 ",
  ])(
    "preserves unsupported degree input %p and the absence of current student_t",
    async progCodeV2 => {
      const { service, semester } = createRepository({
        studentNumber: 20996001,
        studentTerms: [],
      });
      const failure = await service
        .syncSsoIdentity(
          {
            email: "student@example.com",
            studentNumber: "20996001",
            sid: mockSid,
            name: mockStudentName,
            type: "Student",
            department: "",
            typeV2: "S",
            statusV2: "재학",
            progCodeV2: progCodeV2 as never,
          },
          semester,
        )
        .catch(error => error);
      expect(failure).toBeInstanceOf(UserIdentitySyncError);
      expect(failure.cause.message).toBe(
        "현재 학적의 학위 정보를 확인할 수 없습니다. 관리자에게 문의해주세요.",
      );
      expect(failure.diagnostic.db.resolvingStudent.progCodeV2).toBe(
        progCodeV2,
      );
    },
  );

  it.each([
    ["creates the first term", []],
    [
      "corrects a previous doctor term",
      [{ studentId: mockStudentId, studentEnum: 3 }],
    ],
  ] as const)("%s for SSO program 7", async (_, studentTerms) => {
    const studentNumber = 20998083;
    const { service, prisma, semester } = createRepository({
      studentNumber,
      studentTerms: [...studentTerms],
    });
    prisma.studentT.findMany
      .mockResolvedValueOnce(studentTerms)
      .mockResolvedValueOnce([{ studentId: mockStudentId, studentEnum: 4 }]);

    const { identity, diagnostic } = await service.syncSsoIdentity(
      {
        email: "student@example.com",
        studentNumber: studentNumber.toString(),
        sid: mockSid,
        name: mockStudentName,
        type: "Student",
        department: "151",
        typeV2: "S",
        statusV2: "재학",
        progCodeV2: "7",
      },
      semester,
    );

    const studentTermUpsert = prisma.studentT.upsert.mock.calls[0][0];
    expect(studentTermUpsert.create.studentEnum).toBe(4);
    expect(studentTermUpsert.update.studentEnum).toBe(4);
    expect(identity.masterDoctorDoctor).toEqual({
      id: mockStudentId,
      number: studentNumber,
    });
    expect(identity.undergraduate).toBeUndefined();
    expect(identity.master).toBeUndefined();
    expect(identity.doctor).toBeUndefined();
    expect(diagnostic.db?.currentStudentResolution).toMatchObject({
      studentEnum: 4,
      studentStatusEnum: 1,
    });
  });

  it("uses the current student_t enum when returning student profiles after login", async () => {
    const { repository } = createRepository();

    const result = await repository.findOrCreateUser(
      "test-student@example.com",
      defaultStudentNumber.toString(),
      mockSid,
      mockStudentName,
      "Student",
      "1234",
      "S",
      "재학",
      "5",
    );

    expect(result.doctor).toEqual({
      id: mockStudentId,
      number: defaultStudentNumber,
    });
    expect(result.master).toBeUndefined();
  });

  it("uses SSO V2 as source of truth during login when it conflicts with current student_t", async () => {
    const { repository, prisma } = createRepository();
    prisma.studentT.findMany
      .mockResolvedValueOnce([{ studentId: mockStudentId, studentEnum: 3 }])
      .mockResolvedValueOnce([{ studentId: mockStudentId, studentEnum: 2 }]);

    const result = await repository.findOrCreateUser(
      "test-student@example.com",
      defaultStudentNumber.toString(),
      mockSid,
      mockStudentName,
      "Student",
      "1234",
      "S",
      "재학",
      "1",
    );

    const studentTermUpsert = prisma.studentT.upsert.mock.calls[0][0];
    expect(studentTermUpsert.create.studentEnum).toBe(2);
    expect(studentTermUpsert.update.studentEnum).toBe(2);
    expect(result.master).toEqual({
      id: mockStudentId,
      number: defaultStudentNumber,
    });
    expect(result.doctor).toBeUndefined();
  });

  it("uses the current student_t enum when returning student profiles for token refresh", async () => {
    const { repository } = createRepository();

    const result = await repository.findUserById(mockUserId);

    expect(result.doctor).toEqual({
      id: mockStudentId,
      number: defaultStudentNumber,
    });
    expect(result.master).toBeUndefined();
  });

  it.each([
    [4, "masterDoctorDoctor"],
    [5, "masterDoctorMaster"],
    [6, "allPrograms"],
    [7, "auditor"],
  ] as const)(
    "preserves stored enum %s for token refresh without rewriting its degree",
    async (studentEnum, profileKey) => {
      const studentNumber = 20998083;
      const { service, prisma } = createRepository({
        studentNumber,
        studentTerms: [{ studentId: mockStudentId, studentEnum }],
      });

      const identity = await service.findLoginIdentity(mockUserId);

      expect(identity).toEqual({
        id: mockUserId,
        sid: mockSid,
        name: mockStudentName,
        email: "test-student@example.com",
        [profileKey]: { id: mockStudentId, number: studentNumber },
      });
      expect(prisma.studentT.upsert).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["6000-6899 undergraduate", 20996167, 1, "undergraduate"],
    ["6000-6899 master", 20996614, 2, "master"],
    ["7000+ doctor", 20998109, 3, "doctor"],
    ["8000+ masterDoctorDoctor", 20998083, 4, "masterDoctorDoctor"],
    ["8000+ masterDoctorMaster", 20998083, 5, "masterDoctorMaster"],
    ["8000+ allPrograms", 20998083, 6, "allPrograms"],
    ["8000+ auditor", 20998083, 7, "auditor"],
  ] as const)(
    "uses the current student_t enum for %s when login has no SSO V2 degree",
    async (_, studentNumber, studentEnum, expectedProfileKey) => {
      const { repository, prisma } = createRepository({
        studentNumber,
        studentTerms: [{ studentId: mockStudentId, studentEnum }],
      });

      const result = await repository.findOrCreateUser(
        "student@example.com",
        studentNumber.toString(),
        mockSid,
        mockStudentName,
        "Student",
        "1234",
        "S",
        "재학",
        null,
      );

      expect(result[expectedProfileKey]).toEqual({
        id: mockStudentId,
        number: studentNumber,
      });
      expect(prisma.studentT.upsert.mock.calls[0][0].update.studentEnum).toBe(
        studentEnum,
      );
    },
  );

  it.each([
    ["0000-1999", "undergraduate", 20991001],
    ["2000-2999", "master", 20992001],
    ["3000-3999", "master", 20993001],
    ["4000-4999", "master", 20994001],
    ["5000-5999", "doctor", 20995001],
  ] as const)(
    "classifies %s as %s when falling back to student number",
    async (_, expectedProfileKey, studentNumber) => {
      const { repository } = createRepository({
        studentNumber,
        studentTerms: [],
      });

      const result = await repository.findOrCreateUser(
        "student@example.com",
        studentNumber.toString(),
        mockSid,
        mockStudentName,
        "Student",
        "1234",
        "S",
        "재학",
        null,
      );

      expect(result[expectedProfileKey]).toEqual({
        id: mockStudentId,
        number: studentNumber,
      });
    },
  );

  it.each([
    ["stored degree", 20998083, [{ studentId: mockStudentId, studentEnum: 2 }]],
    ["student-number fallback", 20993001, []],
  ] as const)(
    "uses %s for unsupported SSO code 2",
    async (_, studentNumber, studentTerms) => {
      const { repository, prisma } = createRepository({
        studentNumber,
        studentTerms: [...studentTerms],
      });

      const identity = await repository.findOrCreateUser(
        "student@example.com",
        studentNumber.toString(),
        mockSid,
        mockStudentName,
        "Student",
        "1234",
        "S",
        "재학",
        "2",
      );

      expect(identity.master).toEqual({
        id: mockStudentId,
        number: studentNumber,
      });
      expect(identity.doctor).toBeUndefined();
      expect(prisma.studentT.upsert.mock.calls[0][0].create.studentEnum).toBe(
        2,
      );
    },
  );

  it.each([
    ["재학", 1, false],
    ["휴학", 2, false],
    ["재학", 1, true],
    ["휴학", 2, true],
  ] as const)(
    "excludes linked HP profiles on login and refresh: status=%s(%s), HP degree=%s",
    async (statusV2, studentStatusEnum, hasHpDegree) => {
      const currentStudent = { id: mockStudentId, number: 20991001 };
      const hpStudent = { id: mockStudentId + 1, number: 20986954 };
      const { service, prisma, semester } = createRepository({
        studentNumber: currentStudent.number,
      });
      prisma.student.findMany
        .mockReset()
        .mockResolvedValueOnce([currentStudent])
        .mockResolvedValue([hpStudent, currentStudent]);
      prisma.studentT.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValue([
          { studentId: currentStudent.id, studentEnum: 1 },
          ...(hasHpDegree ? [{ studentId: hpStudent.id, studentEnum: 2 }] : []),
        ]);

      const { identity, diagnostic } = await service.syncSsoIdentity(
        {
          email: "student@example.com",
          studentNumber: currentStudent.number.toString(),
          sid: mockSid,
          name: mockStudentName,
          type: "Student",
          department: "1234",
          typeV2: "S",
          statusV2,
          progCodeV2: "0",
        },
        semester,
      );
      const refreshed = await service.findLoginIdentity(mockUserId);

      [identity, refreshed].forEach(result => {
        expect(result.undergraduate).toEqual(currentStudent);
        expect(result.master).toBeUndefined();
      });
      expect(prisma.studentT.upsert.mock.calls[0][0].update).toMatchObject({
        studentEnum: 1,
        studentStatusEnum,
      });
      expect(diagnostic.db?.linkedStudents).toEqual([
        expect.objectContaining(hpStudent),
        expect.objectContaining(currentStudent),
      ]);
    },
  );

  it.each([
    [20996954, "0", "HP 학번은 로그인할 수 없습니다."],
    [20997001, null, "현재 학적의 학위 정보를 확인할 수 없습니다."],
  ] as const)(
    "does not use a past regular student to bypass current rejection for %s",
    async (studentNumber, progCodeV2, message) => {
      const { service, prisma, semester } = createRepository({
        studentNumber,
        studentTerms: [],
      });
      prisma.student.findMany
        .mockReset()
        .mockResolvedValueOnce([{ id: mockStudentId, number: studentNumber }])
        .mockResolvedValue([
          { id: mockStudentId + 1, number: 20981001 },
          { id: mockStudentId, number: studentNumber },
        ]);

      await expect(
        service.syncSsoIdentity(
          {
            email: "student@example.com",
            studentNumber: studentNumber.toString(),
            sid: mockSid,
            name: mockStudentName,
            type: "Student",
            department: "1234",
            typeV2: "S",
            statusV2: "휴학",
            progCodeV2,
          },
          semester,
        ),
      ).rejects.toMatchObject({
        cause: expect.objectContaining({
          message: expect.stringContaining(message),
        }),
      });
      expect(prisma.studentT.upsert).not.toHaveBeenCalled();
    },
  );

  it.each(["1", "7", "8", "9", "10"])(
    "rejects HP students before SSO program %s, DB, or fallback classification",
    async progCodeV2 => {
      const { repository } = createRepository({
        studentNumber: 20996901,
        studentTerms: [{ studentId: mockStudentId, studentEnum: 2 }],
      });

      await expect(
        repository.findOrCreateUser(
          "hp@example.com",
          "20996901",
          mockSid,
          mockStudentName,
          "Student",
          "1234",
          "S",
          "재학",
          progCodeV2,
        ),
      ).rejects.toThrow("HP 학번은 로그인할 수 없습니다.");
    },
  );

  it.each([
    ["6000-6899", 20996001],
    ["7000+", 20997001],
  ] as const)(
    "rejects %s students when falling back to student number",
    async (_, studentNumber) => {
      const { repository } = createRepository({
        studentNumber,
        studentTerms: [],
      });

      await expect(
        repository.findOrCreateUser(
          "exchange@example.com",
          studentNumber.toString(),
          mockSid,
          mockStudentName,
          "Student",
          "1234",
          "S",
          "재학",
          null,
        ),
      ).rejects.toThrow(
        "현재 학적의 학위 정보를 확인할 수 없습니다. 관리자에게 문의해주세요.",
      );
    },
  );

  it("captures the current student failure and the empty query actually used", async () => {
    const studentNumber = "20996001";
    const { repository, prisma } = createRepository({
      studentNumber: Number(studentNumber),
      studentTerms: [],
    });
    const diagnostic: IdentitySyncDiagnostic = { stage: "start" };

    await expect(
      repository.findOrCreateUser(
        "student@example.com",
        studentNumber,
        mockSid,
        mockStudentName,
        "Student",
        "1234",
        "S",
        "재학",
        1 as never,
        diagnostic,
      ),
    ).rejects.toThrow("현재 학적의 학위 정보를 확인할 수 없습니다.");

    expect(diagnostic).toMatchObject({
      stage: "db.current-degree.resolve",
      userId: mockUserId,
      studentId: mockStudentId,
      db: {
        userQueriedAt: currentDate,
        user: { id: mockUserId },
        currentStudentQueriedAt: currentDate,
        currentStudent: {
          id: mockStudentId,
          number: Number(studentNumber),
          ssoNumber: studentNumber,
        },
        resolvingStudent: {
          id: mockStudentId,
          number: studentNumber,
          source: "current",
          progCodeV2: 1,
          hasExistingStudentEnum: false,
          existingStudentEnum: undefined,
        },
        currentStudentTerms: {
          queriedAt: currentDate,
          studentIds: [mockStudentId],
          rows: [],
        },
      },
    });
    expect(diagnostic.db).not.toHaveProperty("linkedStudents");
    expect(prisma.studentT.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.user.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.student.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.studentT.upsert).not.toHaveBeenCalled();
  });

  it("distinguishes a failed student_t query from a successful empty result", async () => {
    const { repository, prisma } = createRepository();
    const diagnostic: IdentitySyncDiagnostic = { stage: "start" };
    const error = new Error("student_t unavailable");
    prisma.studentT.findMany.mockRejectedValueOnce(error);

    await expect(
      repository.findOrCreateUser(
        "student@example.com",
        defaultStudentNumber.toString(),
        mockSid,
        mockStudentName,
        "Student",
        "1234",
        "S",
        "재학",
        "5",
        diagnostic,
      ),
    ).rejects.toBe(error);

    expect(diagnostic.stage).toBe("db.current-degree.read");
    expect(diagnostic.db?.currentStudentTerms).toEqual({
      queriedAt: currentDate,
      studentIds: [mockStudentId],
      validityFilter:
        "startTerm <= queriedAt AND (endTerm IS NULL OR endTerm >= queriedAt) AND deletedAt IS NULL",
      orderBy: ["startTerm DESC", "id DESC"],
      selectedFields: ["studentId", "studentEnum"],
    });
  });

  it("omits an unresolved linked profile on login and refresh while retaining diagnostics", async () => {
    const { repository, service, prisma, clock } = createRepository();
    const linkedStudent = {
      id: mockStudentId + 1,
      number: 20997001,
      userId: mockUserId,
    };
    const currentStudent = {
      id: mockStudentId,
      number: defaultStudentNumber,
      userId: mockUserId,
    };
    const terms = [
      { studentId: mockStudentId, studentEnum: 3 },
      { studentId: mockStudentId, studentEnum: 2 },
    ];
    prisma.student.findMany
      .mockReset()
      .mockResolvedValueOnce([currentStudent])
      .mockResolvedValue([currentStudent, linkedStudent]);
    prisma.studentT.findMany.mockResolvedValue(terms);
    clock.now.mockImplementation(
      () => new Date(currentDate.getTime() + clock.now.mock.calls.length),
    );
    const diagnostic: IdentitySyncDiagnostic = { stage: "start" };

    const identity = await repository.findOrCreateUser(
      "student@example.com",
      defaultStudentNumber.toString(),
      mockSid,
      mockStudentName,
      "Student",
      "1234",
      "S",
      "재학",
      "5",
      diagnostic,
    );
    expect(identity.doctor).toEqual({
      id: mockStudentId,
      number: defaultStudentNumber,
    });
    expect(identity.master).toBeUndefined();

    const currentQuery = prisma.studentT.findMany.mock.calls[0][0];
    const linkedQuery = prisma.studentT.findMany.mock.calls[1][0];
    expect(diagnostic).toMatchObject({
      stage: "db.executive.read",
      userId: mockUserId,
      studentId: mockStudentId,
      db: {
        currentStudent,
        linkedStudents: [currentStudent, linkedStudent],
        resolvingStudent: {
          id: linkedStudent.id,
          number: linkedStudent.number,
          source: "linked",
          progCodeV2: null,
          hasExistingStudentEnum: false,
          existingStudentEnum: undefined,
        },
        currentStudentTerms: {
          queriedAt: currentQuery.where.startTerm.lte,
          studentIds: [mockStudentId],
          rows: terms,
        },
        linkedStudentTerms: {
          queriedAt: linkedQuery.where.startTerm.lte,
          studentIds: [mockStudentId, linkedStudent.id],
          rows: terms,
        },
        currentStudentResolution: {
          studentEnum: 3,
          studentStatusEnum: 1,
          departmentId: 1234,
          existingStudentEnum: 3,
        },
      },
    });
    expect(currentQuery.where.startTerm.lte).not.toEqual(
      linkedQuery.where.startTerm.lte,
    );
    expect(currentQuery.where.OR[1].endTerm.gte).toBe(
      currentQuery.where.startTerm.lte,
    );
    expect(linkedQuery.where.OR[1].endTerm.gte).toBe(
      linkedQuery.where.startTerm.lte,
    );
    expect(currentQuery.orderBy).toEqual([
      { startTerm: "desc" },
      { id: "desc" },
    ]);
    expect(currentQuery.where).not.toHaveProperty("semesterId");
    expect(currentQuery.select).toEqual({ studentId: true, studentEnum: true });
    expect(prisma.studentT.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.user.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.student.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.studentT.upsert).toHaveBeenCalledTimes(1);
    expect(await service.findLoginIdentity(mockUserId)).toEqual(identity);
  });

  it("preserves the student term write failure and the resolved academic context", async () => {
    const { repository, prisma } = createRepository();
    const diagnostic: IdentitySyncDiagnostic = { stage: "start" };
    const error = new Error("student term write unavailable");
    prisma.studentT.upsert.mockRejectedValueOnce(error);

    await expect(
      repository.findOrCreateUser(
        "student@example.com",
        defaultStudentNumber.toString(),
        mockSid,
        mockStudentName,
        "Student",
        "1234",
        "S",
        "재학",
        "5",
        diagnostic,
      ),
    ).rejects.toBe(error);

    expect(diagnostic).toMatchObject({
      stage: "db.student_t.write",
      userId: mockUserId,
      studentId: mockStudentId,
      db: {
        currentStudentResolution: {
          studentEnum: 3,
          studentStatusEnum: 1,
          departmentId: 1234,
        },
      },
    });
    expect(prisma.studentT.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.studentT.update).not.toHaveBeenCalled();
    expect(prisma.student.findMany).toHaveBeenCalledTimes(1);
    expect(diagnostic.db).not.toHaveProperty("linkedStudents");
  });

  it("keeps the successful profile and query count when diagnostics are supplied", async () => {
    const { repository, prisma } = createRepository();
    const diagnostic: IdentitySyncDiagnostic = { stage: "start" };
    const result = await repository.findOrCreateUser(
      "student@example.com",
      defaultStudentNumber.toString(),
      mockSid,
      mockStudentName,
      "Student",
      "1234",
      "S",
      "재학",
      "5",
      diagnostic,
    );

    expect(result).toEqual({
      id: mockUserId,
      sid: mockSid,
      name: mockStudentName,
      email: "test-student@example.com",
      doctor: { id: mockStudentId, number: defaultStudentNumber },
    });
    expect(diagnostic.db?.executives).toEqual([]);
    expect(prisma.studentT.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.student.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.semesterD.findMany).not.toHaveBeenCalled();
  });
});
