import React, { useState } from "react";
import styled from "styled-components";

import { ActivityCertificateOrderStatusEnum } from "@clubs/interface/common/enum/activityCertificate.enum";

import Button from "@sparcs-clubs/web/common/components/Button";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import ProgressStatus from "@sparcs-clubs/web/common/components/ProgressStatus";
import { manageActivityCertificateProgress } from "@sparcs-clubs/web/constants/manageClubProgress";

interface ManageActivityCertificateProgressProps {
  status: ActivityCertificateOrderStatusEnum;
}

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  justify-content: flex-end;
  width: 100%;
`;

const ManageActivityCertificateProgress: React.FC<
  ManageActivityCertificateProgressProps
> = ({ status }) => {
  const [rejectReason, setRejectReason] = useState("");

  const manageActivityCertificate = manageActivityCertificateProgress(status);
  const rejectButtonType = rejectReason !== "" ? "default" : "disabled";

  const onClickConfirm = () => {};
  const onClickReject = () => {};

  return (
    <ProgressStatus
      labels={manageActivityCertificate.labels}
      progress={manageActivityCertificate.progress}
      infoText={manageActivityCertificate.infoText}
      optional={
        status === ActivityCertificateOrderStatusEnum.Applied && (
          <>
            <TextInput
              placeholder="반려 사유를 입력해주세요"
              label="반려 사유 (반려 시에만 입력)"
              area
              value={rejectReason}
              handleChange={setRejectReason}
            />
            <ButtonWrapper>
              <Button style={{ width: "max-content" }} onClick={onClickConfirm}>
                신청 승인
              </Button>
              <Button
                style={{ width: "max-content" }}
                type={rejectButtonType}
                onClick={onClickReject}
              >
                신청 반려
              </Button>
            </ButtonWrapper>
          </>
        )
      }
    />
  );
};

export default ManageActivityCertificateProgress;
