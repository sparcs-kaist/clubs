import { SemesterService } from "./semester.service";

jest.mock("@nestjs-cls/transactional", () => ({
  Transactional: () => () => undefined,
}));

function createService({
  existingSemesterId,
}: { existingSemesterId?: number } = {}) {
  const semesterRepository = {
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    createSemester: jest.fn().mockResolvedValue({ id: 20 }),
    updateSemester: jest.fn().mockResolvedValue({ id: existingSemesterId }),
  };
  const semesterSQLRepository = {
    findSemesterByNameAndYear: jest
      .fn()
      .mockResolvedValue({ id: existingSemesterId }),
  };
  const service = new SemesterService(
    semesterRepository as never,
    semesterSQLRepository as never,
    {} as never,
    {} as never,
  );

  return { semesterRepository, service };
}

describe("SemesterService term weekday validation", () => {
  const validStartTerm = new Date("2026-03-01T15:00:00.000Z");
  const validEndTerm = new Date("2026-08-30T14:59:59.000Z");

  const body = {
    year: 2026,
    name: "봄",
    startTerm: validStartTerm,
    endTerm: validEndTerm,
  };

  it("creates a semester from Monday through Sunday", async () => {
    const { semesterRepository, service } = createService();

    await expect(service.createSemester({ body })).resolves.toEqual({ id: 20 });
    expect(semesterRepository.createSemester).toHaveBeenCalled();
  });

  it.each([
    ["start", new Date("2026-03-02T15:00:00.000Z"), validEndTerm],
    ["end", validStartTerm, new Date("2026-08-29T14:59:59.000Z")],
  ])(
    "rejects a semester with an invalid %s weekday",
    async (_, startTerm, endTerm) => {
      const { semesterRepository, service } = createService();

      await expect(
        service.createSemester({
          body: { ...body, startTerm, endTerm },
        }),
      ).rejects.toThrow("학기 시작일은 월요일, 종료일은 일요일이어야 합니다.");
      expect(semesterRepository.createSemester).not.toHaveBeenCalled();
    },
  );

  it("validates weekdays when updating a semester", async () => {
    const { semesterRepository, service } = createService({
      existingSemesterId: 19,
    });

    await expect(
      service.updateSemester({
        query: { year: body.year, name: body.name },
        body: {
          startTerm: new Date("2026-03-02T15:00:00.000Z"),
          endTerm: validEndTerm,
        },
      }),
    ).rejects.toThrow("학기 시작일은 월요일, 종료일은 일요일이어야 합니다.");
    expect(semesterRepository.updateSemester).not.toHaveBeenCalled();
  });
});
