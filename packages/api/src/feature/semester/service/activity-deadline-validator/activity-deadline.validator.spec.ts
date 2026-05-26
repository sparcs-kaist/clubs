import { hasOverlappingActivityDeadline } from "./activity-deadline.validator";

describe("activity-deadline.validator", () => {
  const existingDeadline = {
    startTerm: new Date("2026-03-10T00:00:00.000Z"),
    endTerm: new Date("2026-03-20T00:00:00.000Z"),
  };

  it("detects an overlapping deadline", () => {
    expect(
      hasOverlappingActivityDeadline([existingDeadline], {
        startTerm: new Date("2026-03-15T00:00:00.000Z"),
        endTerm: new Date("2026-03-25T00:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("allows a deadline that starts when an existing deadline ends", () => {
    expect(
      hasOverlappingActivityDeadline([existingDeadline], {
        startTerm: new Date("2026-03-20T00:00:00.000Z"),
        endTerm: new Date("2026-03-25T00:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("allows a deadline that ends when an existing deadline starts", () => {
    expect(
      hasOverlappingActivityDeadline([existingDeadline], {
        startTerm: new Date("2026-03-01T00:00:00.000Z"),
        endTerm: new Date("2026-03-10T00:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("supports date strings from request-shaped input", () => {
    expect(
      hasOverlappingActivityDeadline([existingDeadline], {
        startTerm: "2026-03-12T00:00:00.000Z",
        endTerm: "2026-03-13T00:00:00.000Z",
      }),
    ).toBe(true);
  });
});
