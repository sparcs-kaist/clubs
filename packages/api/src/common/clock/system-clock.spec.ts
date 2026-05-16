import { SystemClock } from "./system-clock";

describe("SystemClock", () => {
  it("returns the end of the current service day", () => {
    const clock = new SystemClock();

    jest
      .spyOn(clock, "now")
      .mockReturnValue(new Date("2026-05-17T03:00:00.000Z"));

    expect(clock.endOfToday()).toEqual(new Date("2026-05-17T14:59:59.999Z"));
  });

  it("uses the service day even when the UTC runtime date differs", () => {
    const clock = new SystemClock();

    jest
      .spyOn(clock, "now")
      .mockReturnValue(new Date("2026-05-17T16:00:00.000Z"));

    expect(clock.endOfToday()).toEqual(new Date("2026-05-18T14:59:59.999Z"));
  });
});
