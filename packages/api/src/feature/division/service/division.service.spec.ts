import { Clock } from "@sparcs-clubs/api/common/clock/clock";

import DivisionService from "./division.service";

jest.mock("@sparcs-clubs/api/prisma/prisma.service", () => ({
  PrismaService: class PrismaService {},
}));

describe("DivisionService", () => {
  const createService = () => {
    const currentDate = new Date("2026-06-12T00:00:00.000Z");
    const repository = {
      fetchAll: jest.fn().mockResolvedValue([
        {
          id: 1,
          name: "생활문화",
        },
      ]),
    };
    const clock: Clock = {
      now: jest.fn().mockReturnValue(currentDate),
      endOfToday: jest.fn(),
    };
    const service = new DivisionService(repository as never);
    (service as unknown as { clock: Clock }).clock = clock;

    return { clock, currentDate, repository, service };
  };

  it("uses the requested date when fetching divisions", async () => {
    const { repository, service } = createService();
    const requestedDate = new Date("2024-09-01T14:59:00.000Z");

    await (
      service as unknown as {
        getDivisionsCurrent(date?: Date): Promise<unknown>;
      }
    ).getDivisionsCurrent(requestedDate);

    expect(repository.fetchAll).toHaveBeenCalledWith(requestedDate);
  });

  it("falls back to the clock when no date is requested", async () => {
    const { clock, currentDate, repository, service } = createService();

    await service.getDivisionsCurrent();

    expect(clock.now).toHaveBeenCalledTimes(1);
    expect(repository.fetchAll).toHaveBeenCalledWith(currentDate);
  });
});
