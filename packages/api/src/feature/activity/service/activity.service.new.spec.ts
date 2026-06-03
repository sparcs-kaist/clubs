import { ActivityStatusEnum } from "@clubs/domain/activity/activity";
import { ActivityDurationTypeEnum } from "@clubs/domain/semester/activity-duration";
import {
  ActivityDeadlineEnum,
  RegistrationDeadlineEnum,
} from "@clubs/domain/semester/deadline";

import { ActivityTypeEnum } from "@clubs/interface/common/enum/activity.enum";

import { MActivity } from "../model/activity.model.new";
import { MActivityComment } from "../model/activity-comment.model";
import ActivityService from "./activity.service.new";

jest.mock("@nestjs-cls/transactional", () => ({
  Transactional: () => () => undefined,
}));

type ActivityStub = {
  id: number;
  name: string;
  activityTypeEnum: number;
  activityStatusEnum: ActivityStatusEnum;
  durations: {
    startTerm: Date;
    endTerm: Date;
  }[];
};

const NOW = new Date("2026-06-01T12:00:00.000Z");

const injectTestClock = <T extends object>(target: T): T =>
  Object.assign(target, {
    clock: {
      now: () => new Date(Date.now()),
    },
  });

function createRegistrationActivityDuration(id: number, semesterId: number) {
  return {
    id,
    semester: { id: semesterId },
    activityDurationTypeEnum: ActivityDurationTypeEnum.Registration,
    year: 2026,
    name: "봄 신규등록",
    startTerm: new Date("2025-02-24T00:00:00.000Z"),
    endTerm: new Date("2026-03-02T23:59:00.000Z"),
  };
}

function createProvisionalListService({
  activeRegistrationDeadline = null,
  registrationActivityDurations = [],
  activitiesByActivityDurationId = {},
}: {
  activeRegistrationDeadline?: { semester: { id: number } } | null;
  registrationActivityDurations?: ReturnType<
    typeof createRegistrationActivityDuration
  >[];
  activitiesByActivityDurationId?: Record<number, ActivityStub[]>;
} = {}) {
  const activityRepository = {
    find: jest.fn(({ activityDId }: { activityDId: number }) =>
      Promise.resolve(activitiesByActivityDurationId[activityDId] ?? []),
    ),
  };
  const activityDurationPublicService = {
    search: jest.fn().mockResolvedValue(registrationActivityDurations),
  };
  const registrationDeadlinePublicService = {
    searchOne: jest.fn().mockResolvedValue(activeRegistrationDeadline),
  };
  const unusedDependency = {} as never;

  const service = injectTestClock(
    new ActivityService(
      activityRepository as never,
      unusedDependency,
      unusedDependency,
      activityDurationPublicService as never,
      unusedDependency,
      unusedDependency,
      unusedDependency,
      unusedDependency,
      unusedDependency,
      registrationDeadlinePublicService as never,
      unusedDependency,
      unusedDependency,
      unusedDependency,
    ),
  );

  return {
    activityDurationPublicService,
    activityRepository,
    registrationDeadlinePublicService,
    service,
  };
}

describe("ActivityService", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  const activityDuration = {
    id: 10,
    semester: { id: 1 },
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
    activityOverrides: Partial<typeof activity> = {},
  ) => {
    const currentActivity = { ...activity, ...activityOverrides };
    const activityRepository = {
      approveExecutiveActivity: jest.fn().mockResolvedValue(true),
      fetch: jest.fn().mockResolvedValue(currentActivity),
      put: jest.fn().mockResolvedValue(new MActivity(currentActivity)),
      patch: jest.fn().mockResolvedValue([new MActivity(currentActivity)]),
      sendBackExecutiveActivity: jest.fn().mockResolvedValue(true),
    };
    const activityComment = new MActivityComment({
      id: 1,
      activity: { id: currentActivity.id },
      content: "review comment",
      activityStatusEnum: currentActivity.activityStatusEnum,
      createdAt: reviewedAt,
      executive: { id: 7 },
    });
    const activityCommentRepository = {
      createExecutiveReviewComment: jest
        .fn()
        .mockResolvedValue(activityComment),
      create: jest.fn().mockResolvedValue([activityComment]),
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

    const service = injectTestClock(
      new ActivityService(
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
      ),
    );

    return {
      activityRepository,
      activityCommentRepository,
      activityDurationPublicService,
      filePublicService,
      registrationPublicService,
      semesterPublicService,
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
      createService(undefined, {
        activityStatusEnum: ActivityStatusEnum.Applied,
      });

    await service.patchExecutiveActivityApproval({
      executiveId: 7,
      param: { activityId: activity.id },
    });

    expect(activityRepository.approveExecutiveActivity).toHaveBeenCalledWith({
      activityId: activity.id,
      commentedAt,
    });
    expect(
      activityCommentRepository.createExecutiveReviewComment,
    ).toHaveBeenCalledWith({
      activityId: activity.id,
      content: "활동이 승인되었습니다",
      executiveId: 7,
      activityStatusEnum: ActivityStatusEnum.Approved,
    });
    expect(activityRepository.patch).not.toHaveBeenCalled();
    expect(activityCommentRepository.create).not.toHaveBeenCalled();
  });

  it("rejects executive approval for activity reports from another semester before feedback mutation", async () => {
    const {
      activityCommentRepository,
      activityDurationPublicService,
      activityRepository,
      service,
    } = createService(undefined, {
      activityDuration: { id: 99 },
      activityStatusEnum: ActivityStatusEnum.Applied,
    });
    activityDurationPublicService.getById.mockResolvedValueOnce({
      ...activityDuration,
      id: 99,
      semester: { id: 2 },
    });

    await expect(
      service.patchExecutiveActivityApproval({
        executiveId: 7,
        param: { activityId: activity.id },
      }),
    ).rejects.toThrow("current semester");

    expect(activityDurationPublicService.getById).toHaveBeenCalledWith(99);
    expect(activityRepository.approveExecutiveActivity).not.toHaveBeenCalled();
    expect(
      activityCommentRepository.createExecutiveReviewComment,
    ).not.toHaveBeenCalled();
  });

  it("does not create approval feedback when the activity report is already approved", async () => {
    const { activityCommentRepository, activityRepository, service } =
      createService();
    activityRepository.approveExecutiveActivity.mockResolvedValueOnce(false);

    await expect(
      service.patchExecutiveActivityApproval({
        executiveId: 7,
        param: { activityId: activity.id },
      }),
    ).rejects.toThrow("the activity is already approved");

    expect(activityRepository.approveExecutiveActivity).toHaveBeenCalledWith({
      activityId: activity.id,
      commentedAt: expect.any(Date),
    });
    expect(
      activityCommentRepository.createExecutiveReviewComment,
    ).not.toHaveBeenCalled();
  });

  it("throws when approval feedback insertion fails", async () => {
    const { activityCommentRepository, service } = createService(undefined, {
      activityStatusEnum: ActivityStatusEnum.Applied,
    });
    activityCommentRepository.createExecutiveReviewComment.mockResolvedValueOnce(
      null,
    );

    await expect(
      service.patchExecutiveActivityApproval({
        executiveId: 7,
        param: { activityId: activity.id },
      }),
    ).rejects.toThrow("unreachable");
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

    expect(activityRepository.sendBackExecutiveActivity).toHaveBeenCalledWith({
      activityId: activity.id,
      commentedAt,
    });
    expect(
      activityCommentRepository.createExecutiveReviewComment,
    ).toHaveBeenCalledWith({
      activityId: activity.id,
      content: sendBackBody.comment,
      executiveId: 8,
      activityStatusEnum: ActivityStatusEnum.Rejected,
    });
    expect(activityRepository.patch).not.toHaveBeenCalled();
    expect(activityCommentRepository.create).not.toHaveBeenCalled();
  });

  it("rejects executive send-back for activity reports from another semester before feedback mutation", async () => {
    const {
      activityCommentRepository,
      activityDurationPublicService,
      activityRepository,
      service,
    } = createService(undefined, {
      activityDuration: { id: 99 },
      activityStatusEnum: ActivityStatusEnum.Applied,
    });
    activityDurationPublicService.getById.mockResolvedValueOnce({
      ...activityDuration,
      id: 99,
      semester: { id: 2 },
    });

    await expect(
      service.patchExecutiveActivitySendBack({
        executiveId: 8,
        param: { activityId: activity.id },
        body: { comment: "보완 필요" },
      }),
    ).rejects.toThrow("current semester");

    expect(activityDurationPublicService.getById).toHaveBeenCalledWith(99);
    expect(activityRepository.sendBackExecutiveActivity).not.toHaveBeenCalled();
    expect(
      activityCommentRepository.createExecutiveReviewComment,
    ).not.toHaveBeenCalled();
  });

  it("does not create send-back feedback when the status update fails", async () => {
    const { activityCommentRepository, activityRepository, service } =
      createService();
    activityRepository.sendBackExecutiveActivity.mockResolvedValueOnce(false);

    await expect(
      service.patchExecutiveActivitySendBack({
        executiveId: 8,
        param: { activityId: activity.id },
        body: { comment: "보완 필요" },
      }),
    ).rejects.toThrow("failed to send back activity");

    expect(
      activityCommentRepository.createExecutiveReviewComment,
    ).not.toHaveBeenCalled();
  });

  it("throws when send-back feedback insertion fails", async () => {
    const { activityCommentRepository, service } = createService();
    activityCommentRepository.createExecutiveReviewComment.mockResolvedValueOnce(
      null,
    );

    await expect(
      service.patchExecutiveActivitySendBack({
        executiveId: 8,
        param: { activityId: activity.id },
        body: { comment: "보완 필요" },
      }),
    ).rejects.toThrow("unreachable");
  });
});

describe("ActivityService provisional activities", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("loads activities from the requested registration semester", async () => {
    const activityDuration = createRegistrationActivityDuration(30, 19);
    const activity = {
      id: 1,
      name: "Training",
      activityTypeEnum: 1,
      activityStatusEnum: ActivityStatusEnum.Applied,
      durations: [
        {
          startTerm: new Date("2025-03-01T00:00:00.000Z"),
          endTerm: new Date("2025-03-02T00:00:00.000Z"),
        },
      ],
    };
    const {
      activityDurationPublicService,
      activityRepository,
      registrationDeadlinePublicService,
      service,
    } = createProvisionalListService({
      registrationActivityDurations: [activityDuration],
      activitiesByActivityDurationId: {
        30: [activity],
      },
    });

    await expect(
      service.getExecutiveProvisionalActivities({
        query: { clubId: 111, semesterId: 19 },
      }),
    ).resolves.toEqual({
      activities: [
        {
          id: 1,
          name: "Training",
          activityTypeEnumId: 1,
          activityStatusEnumId: ActivityStatusEnum.Applied,
          durations: activity.durations,
        },
      ],
    });

    expect(activityDurationPublicService.search).toHaveBeenCalledWith({
      semesterId: 19,
      activityDurationTypeEnum: ActivityDurationTypeEnum.Registration,
    });
    expect(activityRepository.find).toHaveBeenCalledWith({
      clubId: 111,
      activityDId: 30,
    });
    expect(registrationDeadlinePublicService.searchOne).not.toHaveBeenCalled();
  });

  it("falls back to the active registration deadline semester", async () => {
    const activityDuration = createRegistrationActivityDuration(30, 19);
    const {
      activityDurationPublicService,
      registrationDeadlinePublicService,
      service,
    } = createProvisionalListService({
      activeRegistrationDeadline: { semester: { id: 19 } },
      registrationActivityDurations: [activityDuration],
    });

    await expect(
      service.getStudentProvisionalActivities({
        studentId: 1,
        query: { clubId: 111 },
      }),
    ).resolves.toEqual({ activities: [] });

    expect(registrationDeadlinePublicService.searchOne).toHaveBeenCalledWith({
      date: NOW,
      deadlineEnum: RegistrationDeadlineEnum.ClubRegistrationApplication,
    });
    expect(activityDurationPublicService.search).toHaveBeenCalledWith({
      semesterId: 19,
      activityDurationTypeEnum: ActivityDurationTypeEnum.Registration,
    });
  });

  it("returns an empty list when there is no registration context", async () => {
    const { activityDurationPublicService, activityRepository, service } =
      createProvisionalListService();

    await expect(
      service.getExecutiveProvisionalActivities({
        query: { clubId: 111 },
      }),
    ).resolves.toEqual({ activities: [] });

    expect(activityDurationPublicService.search).not.toHaveBeenCalled();
    expect(activityRepository.find).not.toHaveBeenCalled();
  });

  it("sorts activities by start term and then end term", async () => {
    const firstActivity = {
      id: 2,
      name: "First",
      activityTypeEnum: 1,
      activityStatusEnum: ActivityStatusEnum.Applied,
      durations: [
        {
          startTerm: new Date("2025-02-01T00:00:00.000Z"),
          endTerm: new Date("2025-02-03T00:00:00.000Z"),
        },
      ],
    };
    const secondActivity = {
      id: 1,
      name: "Second",
      activityTypeEnum: 2,
      activityStatusEnum: ActivityStatusEnum.Approved,
      durations: [
        {
          startTerm: new Date("2025-02-02T00:00:00.000Z"),
          endTerm: new Date("2025-02-04T00:00:00.000Z"),
        },
      ],
    };
    const { service } = createProvisionalListService({
      registrationActivityDurations: [
        createRegistrationActivityDuration(30, 19),
      ],
      activitiesByActivityDurationId: {
        30: [secondActivity, firstActivity],
      },
    });

    await expect(
      service.getProfessorProvisionalActivities({
        query: { clubId: 111, semesterId: 19 },
      }),
    ).resolves.toEqual({
      activities: [
        {
          id: 2,
          name: "First",
          activityTypeEnumId: 1,
          activityStatusEnumId: ActivityStatusEnum.Applied,
          durations: firstActivity.durations,
        },
        {
          id: 1,
          name: "Second",
          activityTypeEnumId: 2,
          activityStatusEnumId: ActivityStatusEnum.Approved,
          durations: secondActivity.durations,
        },
      ],
    });
  });
});
