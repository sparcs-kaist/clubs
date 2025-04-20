import React from "react";

import { CommonSpaceUsageOrderStatusEnum } from "@clubs/interface/common/enum/commonSpace.enum";

import Button from "@sparcs-clubs/web/common/components/Button";
import ProgressStatus from "@sparcs-clubs/web/common/components/ProgressStatus";
import { manageCommonSpaceProgress } from "@sparcs-clubs/web/constants/manageClubProgress";

interface CommonSpaceProgressProps {
  status: CommonSpaceUsageOrderStatusEnum;
}

const CommonSpaceProgress: React.FC<CommonSpaceProgressProps> = ({
  status,
}) => {
  const manageCommonSpace = manageCommonSpaceProgress(status);

  // TODO: Implement onClickCancel
  const onClickCancel = () => {};
  return (
    <ProgressStatus
      labels={manageCommonSpace.labels}
      progress={manageCommonSpace.progress}
      infoText={manageCommonSpace.infoText}
      optional={
        status === CommonSpaceUsageOrderStatusEnum.Applied && (
          <Button onClick={onClickCancel} style={{ width: "max-content" }}>
            신청 취소
          </Button>
        )
      }
    />
  );
};

export default CommonSpaceProgress;
