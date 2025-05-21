import { Test } from "@nestjs/testing";

import ActivityController from "./controller/activity.controller";
import ActivityService from "./service/activity.service";

describe("ActivityController", () => {
  let activityController: ActivityController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ActivityController],
    })
      .useMocker(token => {
        // token에 관계없이 빈 리스트 리턴하는 mock service 이용
        if (token === ActivityService) {
          return {
            getStudentActivities: jest.fn().mockResolvedValue([]),
          };
        }

        return {
          getStudentActivities: jest.fn().mockResolvedValue([]),
        };
      })
      .compile();

    activityController = moduleRef.get(ActivityController);
  });

  describe("get all activities", () => {
    it("should throw 401", async () => {
      expect(
        await activityController.getStudentActivities(
          {
            id: 1,
            sid: "1",
            name: "test",
            email: "clubs-test@kaist.ac.kr",
            type: "student",
            studentId: 1,
            studentNumber: 20209999,
          },
          { clubId: 1 },
        ),
      ).toEqual([]);
    });
  });
});
