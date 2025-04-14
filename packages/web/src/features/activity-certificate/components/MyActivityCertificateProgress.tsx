import React from "react";

import { ActivityCertificateOrderStatusEnum } from "@clubs/interface/common/enum/activityCertificate.enum";

import Button from "@sparcs-clubs/web/common/components/Button";
import ProgressStatus from "@sparcs-clubs/web/common/components/ProgressStatus";
import { manageActivityCertificateProgress } from "@sparcs-clubs/web/constants/manageClubProgress";

interface MyActivityCertificateProgressProps {
  status: ActivityCertificateOrderStatusEnum;
}

const MyActivityCertificateProgress: React.FC<
  MyActivityCertificateProgressProps
> = ({ status }) => {
  const myActivityCertificate = manageActivityCertificateProgress(status);

  const onClickCancel = () => {};

  return (
    <ProgressStatus
      labels={myActivityCertificate.labels}
      progress={myActivityCertificate.progress}
      infoText={
        status === ActivityCertificateOrderStatusEnum.Applied
          ? "승인이 완료되기 전까지 신청을 취소할 수 있습니다"
          : myActivityCertificate.infoText
      }
      optional={
        status === ActivityCertificateOrderStatusEnum.Applied && (
          <Button onClick={onClickCancel} style={{ width: "max-content" }}>
            신청 취소
          </Button>
        )
      }
    />
  );
};

export default MyActivityCertificateProgress;
