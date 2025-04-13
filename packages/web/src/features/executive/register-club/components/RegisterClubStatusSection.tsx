import React, { useMemo } from "react";

import { RegistrationStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import ProgressStatus from "@sparcs-clubs/web/common/components/ProgressStatus";
import CommentToast from "@sparcs-clubs/web/common/components/Toast/CommentToast";
import { getRegisterClubProgress } from "@sparcs-clubs/web/features/register-club/constants/registerClubProgress";
import { Comment } from "@sparcs-clubs/web/types/comment";

interface RegisterClubStatusSectionProps {
  status: RegistrationStatusEnum;
  editedAt: Date;
  comments: Comment[];
}

const RegisterClubStatusSection: React.FC<RegisterClubStatusSectionProps> = ({
  status,
  editedAt,
  comments,
}) => {
  const progressStatus = getRegisterClubProgress(status, editedAt);

  const ToastSection = useMemo(() => {
    if (status === RegistrationStatusEnum.Rejected) {
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

export default RegisterClubStatusSection;
