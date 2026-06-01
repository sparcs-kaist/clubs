import { ActivityStatusEnum } from "@clubs/domain/activity/activity";
import { ActivityDeadlineEnum } from "@clubs/domain/semester/deadline";
import { ActivityTypeEnum } from "@clubs/interface/common/enum/activity.enum";

import { MActivity } from "../model/activity.model.new";
import ActivityService from "./activity.service.new";

describe("ActivityService", () => {
  const activityDuration = {
    id: 10,
    startTerm: new Date("2026-03-01T00:00:00.000Z"),
    endTerm: new Date("2026-06-30T14:59:59.999Z"),
  };
  const approvedAt = new Date("2026-04-01T00:00:00.000Z");
  const editedAt = new Date("2026-04-02T00:00:00.000Z");
  const activity = {
    id: 1,
    name: "original activity",
    activityTypeEnum: ActivityTypeEnum.matchedInternalActivity,
    durations: [
      {
        startTerm: new Date("2026-03-10T00:00:00.000Z"),
        endTerm: new Date("2026-03-11T00:00:00.000Z"),
      },
    ],
    location: "N1",
    purpose: "purpose",
    detail: "detail",
    evidence: "evidence",
    evidenceFiles: [{ id: "file-1" }],
    participants: [{ id: 1 }],
    chargedExecutive: { id: 7 },
    activityDuration: { id: activityDuration.id },
    activityStatusEnum: ActivityStatusEnum.Approved,
    club: { id: 20 },
    editedAt,
    professorApprovedAt: approvedAt,
    commentedAt: null,
    commentedExecutive: null,
  };
  const body = {
    name: "updated activity",
    activityTypeEnumId: ActivityTypeEnum.matchedExternalActivity,
    durations: [
      {
        startTerm: new Date("2026-03-12T00:00:00.000Z"),
        endTerm: new Date("2026-03-13T00:00:00.000Z"),
      },
    ],
    location: "N2",
    purpose: "updated purpose",
    detail: "updated detail",
    evidence: "updated evidence",
    evidenceFiles: [{ fileId: "file-2" }],
    participants: [{ studentId: 1 }],
  };

  const createService = (
    activityDeadlines = [{ deadlineEnum: ActivityDeadlineEnum.Writing }],
  ) => {
    const activityRepository = {
      fetch: jest.fn().mockResolvedValue(activity),
      put: jest.fn().mockResolvedValue(new MActivity(activity)),
    };
    const clubPublicService = {
      checkIsStudentDelegate: jest.fn().mockResolvedValue(undefined),
      getMemberFromSemester: jest
        .fn()
        .mockResolvedValue([{ studentId: 1 }, { studentId: 2 }]),
    };
    const filePublicService = {
      getFileInfoById: jest
        .fn()
        .mockImplementation((id: string) => Promise.resolve({ id })),
    };
    const registrationPublicService = {
      resetClubRegistrationStatusEnum: jest.fn().mockResolvedValue(undefined),
    };
    const activityDurationPublicService = {
      load: jest.fn().mockResolvedValue(activityDuration),
      getById: jest.fn().mockResolvedValue(activityDuration),
    };
    const activityDeadlinePublicService = {
      search: jest.fn().mockResolvedValue(activityDeadlines),
    };
    const semesterPublicService = {
      loadId: jest.fn().mockResolvedValue(1),
    };
    const activityDurationValidatorService = {
      getValidationError: jest.fn().mockReturnValue(null),
    };

    const service = new ActivityService(
      activityRepository as never,
      {} as never,
      {} as never,
      activityDurationPublicService as never,
      activityDeadlinePublicService as never,
      semesterPublicService as never,
      clubPublicService as never,
      filePublicService as never,
      registrationPublicService as never,
      {} as never,
      {} as never,
      {} as never,
      activityDurationValidatorService as never,
    );

    return {
      activityRepository,
      filePublicService,
      registrationPublicService,
      service,
    };
  };

  it("clears professor approval when a regular activity report is edited during the writing period", async () => {
    const { activityRepository, service } = createService([
      { deadlineEnum: ActivityDeadlineEnum.Writing },
    ]);

    await service.putStudentActivity({ activityId: activity.id }, body, 1);

    const updatedActivity = activityRepository.put.mock
      .calls[0][0] as MActivity;
    expect(updatedActivity.activityStatusEnum).toBe(ActivityStatusEnum.Applied);
    expect(updatedActivity.professorApprovedAt).toBeNull();
  });

  it("keeps professor approval when a regular activity report is edited during the modification period", async () => {
    const { activityRepository, service } = createService([
      { deadlineEnum: ActivityDeadlineEnum.Modification },
    ]);

    await service.putStudentActivity({ activityId: activity.id }, body, 1);

    const updatedActivity = activityRepository.put.mock
      .calls[0][0] as MActivity;
    expect(updatedActivity.activityStatusEnum).toBe(ActivityStatusEnum.Applied);
    expect(updatedActivity.professorApprovedAt).toBeUndefined();
  });

  it("keeps professor approval when a provisional activity report is edited", async () => {
    const { activityRepository, registrationPublicService, service } =
      createService();

    await service.putStudentActivityProvisional(
      { activityId: activity.id },
      body,
      1,
    );

    const updatedActivity = activityRepository.put.mock
      .calls[0][0] as MActivity;
    expect(updatedActivity.activityStatusEnum).toBe(ActivityStatusEnum.Applied);
    expect(updatedActivity.professorApprovedAt).toBeUndefined();
    expect(
      registrationPublicService.resetClubRegistrationStatusEnum,
    ).toHaveBeenCalledWith(activity.club.id);
  });
});
