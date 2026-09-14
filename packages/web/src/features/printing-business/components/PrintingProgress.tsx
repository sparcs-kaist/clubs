import { useTranslations } from "next-intl";
import React from "react";

import { PromotionalPrintingOrderStatusEnum } from "@clubs/interface/common/enum/promotionalPrinting.enum";

import Button from "@sparcs-clubs/web/common/components/Button";
import ProgressStatus from "@sparcs-clubs/web/common/components/ProgressStatus";
import { managePrintingProgress } from "@sparcs-clubs/web/constants/manageClubProgress";

interface ManagePrintingProgressProps {
  status: PromotionalPrintingOrderStatusEnum;
}

const PrintingProgress: React.FC<ManagePrintingProgressProps> = ({
  status,
}) => {
  const t = useTranslations("my.services");
  const progressT = useTranslations("my.services.progress");
  const managePrinting = managePrintingProgress(status, progressT);
  const onClickCancel = () => {};
  return (
    <ProgressStatus
      labels={managePrinting.labels}
      progress={managePrinting.progress}
      infoText={managePrinting.infoText}
      optional={
        status === PromotionalPrintingOrderStatusEnum.Applied && (
          <Button onClick={onClickCancel} style={{ width: "max-content" }}>
            {t("cancel")}
          </Button>
        )
      }
    />
  );
};

export default PrintingProgress;
