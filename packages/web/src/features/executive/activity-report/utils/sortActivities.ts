import { ApiAct024ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct024";
import { ApiAct028ResponseOk } from "@clubs/interface/api/activity/endpoint/apiAct028";
import { ActivityStatusEnum } from "@clubs/interface/common/enum/activity.enum";

const statusOrder = {
  [ActivityStatusEnum.Applied]: 0,
  [ActivityStatusEnum.Rejected]: 1,
  [ActivityStatusEnum.Approved]: 2,
  [ActivityStatusEnum.Committee]: 3,
};

const sortActivitiesByStatusAndActivityId = (
  activities: ApiAct024ResponseOk["items"],
) =>
  activities.sort((a, b) => {
    if (
      statusOrder[a.activityStatusEnum] !== statusOrder[b.activityStatusEnum]
    ) {
      return (
        statusOrder[a.activityStatusEnum] - statusOrder[b.activityStatusEnum]
      );
    }
    return a.activityId < b.activityId ? -1 : 1;
  });

const sortActivitiesByStatusAndCommentedDate = (
  activities: ApiAct028ResponseOk["activities"],
) =>
  activities.sort((a, b) => {
    if (
      statusOrder[a.activityStatusEnum] !== statusOrder[b.activityStatusEnum]
    ) {
      return (
        statusOrder[a.activityStatusEnum] - statusOrder[b.activityStatusEnum]
      );
    }
    if (a.commentedAt !== b.commentedAt) {
      if (!a.commentedAt) return -1;
      if (!b.commentedAt) return 1;
      return (
        new Date(b.commentedAt ?? b.updatedAt).getTime() -
        new Date(a.commentedAt ?? a.updatedAt).getTime()
      );
    }
    return 0;
  });

export {
  sortActivitiesByStatusAndActivityId,
  sortActivitiesByStatusAndCommentedDate,
};
