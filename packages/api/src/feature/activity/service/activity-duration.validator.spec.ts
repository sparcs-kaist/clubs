import { Test } from "@nestjs/testing";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";

import {
  ACTIVITY_DURATION_FUTURE_ERROR,
  ACTIVITY_DURATION_OUT_OF_TARGET_ERROR,
  ActivityDurationValidatorService,
  getActivityDurationValidationError,
} from "./activity-duration.validator";

describe("activity-duration.validator", () => {
  const activityD = {
    startTerm: new Date("2026-03-01T00:00:00.000Z"),
    endTerm: new Date("2026-06-30T14:59:59.999Z"),
  };

  const createValidator = async (endOfToday: Date) => {
    const clockService = {
      now: jest.fn(() => new Date("2026-05-17T03:00:00.000Z")),
      endOfToday: jest.fn(() => endOfToday),
    } satisfies Clock;
    const moduleRef = await Test.createTestingModule({
      providers: [
        ActivityDurationValidatorService,
        { provide: CLOCK, useValue: clockService },
      ],
    }).compile();

    return {
      clockService,
      validator: moduleRef.get(ActivityDurationValidatorService),
    };
  };

  it("allows durations ending today when the activity duration continues", async () => {
    const { clockService, validator } = await createValidator(
      new Date("2026-05-17T14:59:59.999Z"),
    );

    const durations = [
      {
        startTerm: new Date("2026-05-17T00:00:00.000Z"),
        endTerm: new Date("2026-05-17T14:59:59.999Z"),
      },
    ];

    expect(() =>
      validator.getValidationError(durations, activityD),
    ).not.toThrow();
    expect(validator.getValidationError(durations, activityD)).toBeNull();
    expect(clockService.endOfToday).toHaveBeenCalled();
  });

  it("rejects durations ending after today with a future-date message", async () => {
    const { validator } = await createValidator(
      new Date("2026-05-17T14:59:59.999Z"),
    );

    const result = validator.getValidationError(
      [
        {
          startTerm: new Date("2026-05-17T00:00:00.000Z"),
          endTerm: new Date("2026-05-18T14:59:00.000Z"),
        },
      ],
      activityD,
    );

    expect(result).toBe(ACTIVITY_DURATION_FUTURE_ERROR);
  });

  it("keeps the target-duration message for dates outside ActivityD", async () => {
    const { validator } = await createValidator(
      new Date("2026-06-29T14:59:59.999Z"),
    );

    const result = validator.getValidationError(
      [
        {
          startTerm: new Date("2026-06-30T00:00:00.000Z"),
          endTerm: new Date("2026-07-01T14:59:00.000Z"),
        },
      ],
      activityD,
    );

    expect(result).toBe(ACTIVITY_DURATION_OUT_OF_TARGET_ERROR);
  });

  it("rejects reversed durations with the target-duration message", async () => {
    const { validator } = await createValidator(
      new Date("2026-05-17T14:59:59.999Z"),
    );

    const result = validator.getValidationError(
      [
        {
          startTerm: new Date("2026-05-18T00:00:00.000Z"),
          endTerm: new Date("2026-05-17T14:59:00.000Z"),
        },
      ],
      activityD,
    );

    expect(result).toBe(ACTIVITY_DURATION_OUT_OF_TARGET_ERROR);
  });

  it("rejects durations starting before ActivityD with the target-duration message", async () => {
    const { validator } = await createValidator(
      new Date("2026-05-17T14:59:59.999Z"),
    );

    const result = validator.getValidationError(
      [
        {
          startTerm: new Date("2026-02-28T00:00:00.000Z"),
          endTerm: new Date("2026-05-17T14:59:00.000Z"),
        },
      ],
      activityD,
    );

    expect(result).toBe(ACTIVITY_DURATION_OUT_OF_TARGET_ERROR);
  });

  it("returns validation errors from the pure function without using DI", () => {
    expect(
      getActivityDurationValidationError(
        [
          {
            startTerm: new Date("2026-05-17T00:00:00.000Z"),
            endTerm: new Date("2026-05-18T14:59:00.000Z"),
          },
        ],
        activityD,
        new Date("2026-05-17T14:59:59.999Z"),
      ),
    ).toBe(ACTIVITY_DURATION_FUTURE_ERROR);
  });
});
