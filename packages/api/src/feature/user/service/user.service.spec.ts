import { UserService } from "./user.service";

describe("UserService", () => {
  describe("createExecutive", () => {
    it("passes incoming dates through to prisma-backed repositories", async () => {
      const userRepository = {
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
