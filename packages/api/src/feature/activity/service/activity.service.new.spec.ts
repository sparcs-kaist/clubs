import { ActivityStatusEnum } from "@clubs/domain/activity/activity";
import { ActivityDeadlineEnum } from "@clubs/domain/semester/deadline";

import { ActivityTypeEnum } from "@clubs/interface/common/enum/activity.enum";

import { MActivity } from "../model/activity.model.new";
import ActivityService from "./activity.service.new";

describe("ActivityService", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  const activityDuration = {
    id: 10,
    startTerm: new Date("2026-03-01T00:00:00.000Z"),
    endTerm: new Date("2026-06-30T14:59:59.999Z"),
  };
  const approvedAt = new Date("2026-04-01T00:00:00.000Z");
  const editedAt = new Date("2026-04-02T00:00:00.000Z");
  const reviewedAt = new Date("2026-04-03T00:00:00.000Z");
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
    commentedAt: reviewedAt,
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
      patch: jest.fn().mockResolvedValue([new MActivity(activity)]),
    };
    const activityCommentRepository = {
      create: jest.fn().mockResolvedValue([{}]),
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
      activityCommentRepository as never,
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
      activityCommentRepository,
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
    expect(updatedActivity.commentedAt).toBeNull();
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
    expect(updatedActivity.commentedAt).toBeNull();
  });

  it("rejects regular activity report edits outside writing and modification periods", async () => {
    const { activityRepository, service } = createService([]);

    await expect(
      service.putStudentActivity({ activityId: activity.id }, body, 1),
    ).rejects.toThrow("is empty");
    expect(activityRepository.put).not.toHaveBeenCalled();
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
    expect(updatedActivity.commentedAt).toBeNull();
    expect(
      registrationPublicService.resetClubRegistrationStatusEnum,
    ).toHaveBeenCalledWith(activity.club.id);
  });

  it("sets commentedAt when an executive approves an activity report", async () => {
    const commentedAt = new Date("2026-05-01T12:00:00.000Z");
    jest.useFakeTimers().setSystemTime(commentedAt);
    const { activityCommentRepository, activityRepository, service } =
      createService();

    await service.patchExecutiveActivityApproval({
      executiveId: 7,
      param: { activityId: activity.id },
    });

    const patchActivity = activityRepository.patch.mock.calls[0][1] as (
      model: MActivity,
    ) => MActivity;
    const updatedActivity = patchActivity(new MActivity(activity));

    expect(updatedActivity.activityStatusEnum).toBe(
      ActivityStatusEnum.Approved,
    );
    expect(updatedActivity.commentedAt).toEqual(commentedAt);
    expect(activityCommentRepository.create).toHaveBeenCalledWith({
      activity: { id: activity.id },
      content: "활동이 승인되었습니다",
      executive: { id: 7 },
      activityStatusEnum: ActivityStatusEnum.Approved,
    });
  });

  it("sets commentedAt when an executive sends back an activity report", async () => {
    const commentedAt = new Date("2026-05-02T12:00:00.000Z");
    jest.useFakeTimers().setSystemTime(commentedAt);
    const { activityCommentRepository, activityRepository, service } =
      createService();
    const sendBackBody = { comment: "보완 필요" };

    await service.patchExecutiveActivitySendBack({
      executiveId: 8,
      param: { activityId: activity.id },
      body: sendBackBody,
    });

    const patchActivity = activityRepository.patch.mock.calls[0][1] as (
      model: MActivity,
    ) => MActivity;
    const updatedActivity = patchActivity(new MActivity(activity));

    expect(updatedActivity.activityStatusEnum).toBe(
      ActivityStatusEnum.Rejected,
    );
    expect(updatedActivity.commentedAt).toEqual(commentedAt);
    expect(activityCommentRepository.create).toHaveBeenCalledWith({
      activity: { id: activity.id },
      content: sendBackBody.comment,
      executive: { id: 8 },
      activityStatusEnum: ActivityStatusEnum.Rejected,
    });
  });
});
