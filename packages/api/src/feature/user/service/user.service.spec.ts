import { UserService } from "./user.service";

describe("UserService", () => {
  describe("createExecutive", () => {
    it("passes incoming dates through to prisma-backed repositories", async () => {
      const userRepository = {
        findStudentByStudentNumber: jest.fn().mockResolvedValue({
          id: 1,
          userId: 2,
          email: "student@kaist.ac.kr",
          name: "홍길동",
        }),
        findStudentByStudentNumberNameDate: jest.fn().mockResolvedValue([
          {
            student: {
              id: 1,
              userId: 2,
              email: "student@kaist.ac.kr",
            },
          },
        ]),
      };
      const executiveRepository = {
        findExecutiveByUserId: jest.fn().mockResolvedValue(true),
        checkExistExecutiveByIdDate: jest.fn().mockResolvedValue(false),
        createExecutive: jest.fn().mockResolvedValue(true),
      };
      const service = new UserService(
        userRepository as unknown as ConstructorParameters<
          typeof UserService
        >[0],
        {} as ConstructorParameters<typeof UserService>[1],
        executiveRepository as unknown as ConstructorParameters<
          typeof UserService
        >[2],
        {} as ConstructorParameters<typeof UserService>[3],
        {} as ConstructorParameters<typeof UserService>[4],
        {} as ConstructorParameters<typeof UserService>[5],
      );
      const startTerm = new Date("2025-02-28T15:00:00.000Z");

      await service.createExecutive(10, {
        studentNumber: "20201234",
        name: "홍길동",
        startTerm,
      });

      expect(
        userRepository.findStudentByStudentNumberNameDate,
      ).toHaveBeenCalledWith("20201234", "홍길동", startTerm, null);
      expect(
        executiveRepository.checkExistExecutiveByIdDate,
      ).toHaveBeenCalledWith(1, startTerm, null);
      expect(executiveRepository.createExecutive).toHaveBeenCalledWith(
        1,
        2,
        "student@kaist.ac.kr",
        "홍길동",
        startTerm,
        null,
      );
    });

    it("reports when a student number does not exist", async () => {
      const userRepository = {
        findStudentByStudentNumber: jest.fn().mockResolvedValue(null),
        findStudentByStudentNumberNameDate: jest.fn(),
      };
      const executiveRepository = {
        findExecutiveByUserId: jest.fn().mockResolvedValue(true),
      };
      const service = new UserService(
        userRepository as unknown as ConstructorParameters<
          typeof UserService
        >[0],
        {} as ConstructorParameters<typeof UserService>[1],
        executiveRepository as unknown as ConstructorParameters<
          typeof UserService
        >[2],
        {} as ConstructorParameters<typeof UserService>[3],
        {} as ConstructorParameters<typeof UserService>[4],
        {} as ConstructorParameters<typeof UserService>[5],
      );

      await expect(
        service.createExecutive(10, {
          studentNumber: "20201234",
          name: "홍길동",
          startTerm: new Date("2025-02-28T15:00:00.000Z"),
        }),
      ).rejects.toMatchObject({
        message: "해당 학번의 학생을 찾을 수 없습니다.",
        status: 400,
      });
      expect(
        userRepository.findStudentByStudentNumberNameDate,
      ).not.toHaveBeenCalled();
    });

    it("reports when student number and name do not match", async () => {
      const userRepository = {
        findStudentByStudentNumber: jest.fn().mockResolvedValue({
          id: 1,
          userId: 2,
          email: "student@kaist.ac.kr",
          name: "김철수",
        }),
        findStudentByStudentNumberNameDate: jest.fn(),
      };
      const executiveRepository = {
        findExecutiveByUserId: jest.fn().mockResolvedValue(true),
      };
      const service = new UserService(
        userRepository as unknown as ConstructorParameters<
          typeof UserService
        >[0],
        {} as ConstructorParameters<typeof UserService>[1],
        executiveRepository as unknown as ConstructorParameters<
          typeof UserService
        >[2],
        {} as ConstructorParameters<typeof UserService>[3],
        {} as ConstructorParameters<typeof UserService>[4],
        {} as ConstructorParameters<typeof UserService>[5],
      );

      await expect(
        service.createExecutive(10, {
          studentNumber: "20201234",
          name: "홍길동",
          startTerm: new Date("2025-02-28T15:00:00.000Z"),
        }),
      ).rejects.toMatchObject({
        message: "학번과 이름이 일치하지 않습니다.",
        status: 400,
      });
      expect(
        userRepository.findStudentByStudentNumberNameDate,
      ).not.toHaveBeenCalled();
    });

    it("reports when the requested start date is outside the student term", async () => {
      const userRepository = {
        findStudentByStudentNumber: jest.fn().mockResolvedValue({
          id: 1,
          userId: 2,
          email: "student@kaist.ac.kr",
          name: "홍길동",
        }),
        findStudentByStudentNumberNameDate: jest.fn().mockResolvedValue([]),
      };
      const executiveRepository = {
        findExecutiveByUserId: jest.fn().mockResolvedValue(true),
      };
      const service = new UserService(
        userRepository as unknown as ConstructorParameters<
          typeof UserService
        >[0],
        {} as ConstructorParameters<typeof UserService>[1],
        executiveRepository as unknown as ConstructorParameters<
          typeof UserService
        >[2],
        {} as ConstructorParameters<typeof UserService>[3],
        {} as ConstructorParameters<typeof UserService>[4],
        {} as ConstructorParameters<typeof UserService>[5],
      );

      await expect(
        service.createExecutive(10, {
          studentNumber: "20201234",
          name: "홍길동",
          startTerm: new Date("2025-02-28T15:00:00.000Z"),
        }),
      ).rejects.toMatchObject({
        message: "집행부원 시작일이 해당 학생의 학적 기간과 겹치지 않습니다.",
        status: 400,
      });
    });
  });

  describe("updateExecutiveTerm", () => {
    it("passes nullable endTerm through to prisma-backed repositories", async () => {
      const executiveRepository = {
        findExecutiveByUserId: jest.fn().mockResolvedValue(true),
        selectExecutiveTermById: jest.fn().mockResolvedValue({
          id: 5,
          executive: {
            studentId: 1,
          },
        }),
        checkExistExecutiveByIdDate: jest.fn().mockResolvedValue(false),
        updateExecutiveTerm: jest.fn().mockResolvedValue(true),
      };
      const service = new UserService(
        {} as ConstructorParameters<typeof UserService>[0],
        {} as ConstructorParameters<typeof UserService>[1],
        executiveRepository as unknown as ConstructorParameters<
          typeof UserService
        >[2],
        {} as ConstructorParameters<typeof UserService>[3],
        {} as ConstructorParameters<typeof UserService>[4],
        {} as ConstructorParameters<typeof UserService>[5],
      );
      const startTerm = new Date("2025-02-28T15:00:00.000Z");

      await service.updateExecutiveTerm(
        10,
        { executiveTId: 5 },
        {
          startTerm,
          endTerm: null,
        },
      );

      expect(executiveRepository.selectExecutiveTermById).toHaveBeenCalledWith(
        5,
      );
      expect(
        executiveRepository.checkExistExecutiveByIdDate,
      ).toHaveBeenCalledWith(1, startTerm, null, 5);
      expect(executiveRepository.updateExecutiveTerm).toHaveBeenCalledWith(
        5,
        startTerm,
        null,
      );
    });
  });
});
