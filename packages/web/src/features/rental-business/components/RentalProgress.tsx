import { useTranslations } from "next-intl";
import React from "react";

import { RentalOrderStatusEnum } from "@clubs/interface/common/enum/rental.enum";

import Button from "@sparcs-clubs/web/common/components/Button";
import ProgressStatus from "@sparcs-clubs/web/common/components/ProgressStatus";
import { manageRentalProgress } from "@sparcs-clubs/web/constants/manageClubProgress";

interface RentalProgressProps {
  status: RentalOrderStatusEnum;
}

const RentalProgress: React.FC<RentalProgressProps> = ({ status }) => {
  const t = useTranslations("my.services");
  const progressT = useTranslations("my.services.progress");
  const manageRental = manageRentalProgress(status, progressT);
  const onClickCancel = () => {};
  return (
    <ProgressStatus
      labels={manageRental.labels}
      progress={manageRental.progress}
      infoText={manageRental.infoText}
      optional={
        status === RentalOrderStatusEnum.Applied && (
          <Button onClick={onClickCancel} style={{ width: "max-content" }}>
            {t("cancel")}
          </Button>
        )
      }
    />
  );
};

export default RentalProgress;
