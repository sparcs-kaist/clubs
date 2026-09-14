import { useTranslations } from "next-intl";
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
  const t = useTranslations("my.services");
  const progressT = useTranslations("my.services.progress");
  const myActivityCertificate = manageActivityCertificateProgress(
    status,
    progressT,
  );

  const onClickCancel = () => {};

  return (
    <ProgressStatus
      labels={myActivityCertificate.labels}
      progress={myActivityCertificate.progress}
      infoText={
        status === ActivityCertificateOrderStatusEnum.Applied
          ? progressT("cancelBeforeApproval")
          : myActivityCertificate.infoText
      }
      optional={
        status === ActivityCertificateOrderStatusEnum.Applied && (
          <Button onClick={onClickCancel} style={{ width: "max-content" }}>
            {t("cancel")}
          </Button>
        )
      }
    />
  );
};

export default MyActivityCertificateProgress;
