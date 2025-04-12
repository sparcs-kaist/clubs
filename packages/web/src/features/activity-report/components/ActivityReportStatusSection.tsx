import React, { useMemo } from "react";

import { ActivityStatusEnum } from "@clubs/interface/common/enum/activity.enum";

import ProgressStatus from "@sparcs-clubs/web/common/components/ProgressStatus";
import CommentToast from "@sparcs-clubs/web/common/components/Toast/CommentToast";
import { Comment } from "@sparcs-clubs/web/types/comment";

import { getActivityReportProgress } from "../constants/activityReportProgress";

interface ActivityReportStatusSectionProps {
  status: ActivityStatusEnum;
  editedAt: Date;
  commentedAt?: Date;
  comments: Comment[];
}

const ActivityReportStatusSection: React.FC<
  ActivityReportStatusSectionProps
> = ({ status, editedAt, commentedAt = undefined, comments }) => {
  const progressStatus = getActivityReportProgress(
    status,
    editedAt,
    commentedAt,
  );

  const ToastSection = useMemo(() => {
    if (status === ActivityStatusEnum.Rejected) {
      return (
        <CommentToast
          title="코멘트"
          reasons={comments.map(comment => ({
            datetime: comment.createdAt,
            reason: comment.content,
          }))}
          color="red"
        />
      );
    }

    return (
      <CommentToast
        title="코멘트"
        reasons={comments.map(comment => ({
          datetime: comment.createdAt,
          reason: comment.content,
        }))}
        color="green"
      />
    );
  }, [comments, status]);

  return (
    <ProgressStatus
      labels={progressStatus.labels}
      progress={progressStatus.progress}
      optional={comments && comments.length > 0 && ToastSection}
    />
  );
};

export default ActivityReportStatusSection;
