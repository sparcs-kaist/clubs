import { useTranslations } from "next-intl";

import { ProfessorApprovalStatus } from "@clubs/domain/activity/activity";

import Tag from "@sparcs-clubs/web/common/components/Tag";
import { getProfessorApprovalTagColor } from "@sparcs-clubs/web/types/professorApproval";

const RegistrationSignatureTag = ({
  status,
}: {
  status: ProfessorApprovalStatus;
}) => {
  const t = useTranslations("my.registration");
  return (
    <Tag color={getProfessorApprovalTagColor(status)}>
      {t(`signatureStatus.${status}`)}
    </Tag>
  );
};

export default RegistrationSignatureTag;
