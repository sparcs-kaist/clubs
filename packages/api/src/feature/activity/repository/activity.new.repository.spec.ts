import { ActivityStatusEnum } from "@clubs/domain/activity/activity";

import { ActivityNewRepository } from "./activity.new.repository";

describe("ActivityNewRepository", () => {
  describe("approveExecutiveActivity", () => {
    it("updates approval metadata without excluding already approved activities", async () => {
      const commentedAt = new Date("2026-05-03T12:00:00.000Z");
      const updatedAt = new Date("2026-05-03T12:00:01.000Z");
      const updateMany = jest.fn().mockResolvedValue({ count: 1 });
      const repository = Object.assign(
        new ActivityNewRepository({
          tx: {
            activity: {
              updateMany,
            },
          },
        } as never),
        {
          clock: {
            now: () => updatedAt,
          },
        },
      );

      const result = await repository.approveExecutiveActivity({
        activityId: 42,
        commentedAt,
      });

      expect(result).toBe(true);
      expect(updateMany).toHaveBeenCalledWith({
        where: {
          id: 42,
          deletedAt: null,
        },
        data: {
          activityStatusEnumId: ActivityStatusEnum.Approved,
          commentedAt,
          updatedAt,
        },
      });
    });
  });
});
