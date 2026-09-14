import { useTranslations } from "next-intl";
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
  const progressT = useTranslations("my.services.progress");
  const [rejectReason, setRejectReason] = useState("");

  const manageActivityCertificate = manageActivityCertificateProgress(
    status,
    progressT,
  );
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
              placeholder={progressT("rejectPlaceholder")}
              label={progressT("rejectLabel")}
              area
              value={rejectReason}
              handleChange={setRejectReason}
            />
            <ButtonWrapper>
              <Button style={{ width: "max-content" }} onClick={onClickConfirm}>
                {progressT("approve")}
              </Button>
              <Button
                style={{ width: "max-content" }}
                type={rejectButtonType}
                onClick={onClickReject}
              >
                {progressT("reject")}
              </Button>
            </ButtonWrapper>
          </>
        )
      }
    />
  );
};

export default ManageActivityCertificateProgress;
