import { useTranslations } from "next-intl";

import { ProfessorApprovalStatus } from "@clubs/domain/activity/activity";

import type { ApiReg022ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg022";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { RegistrationStatusTagList } from "@sparcs-clubs/web/constants/tableTagList";
import { useLanguage } from "@sparcs-clubs/web/i18n/hooks/useLanguage";
import {
  formatDateTime,
  formatDateTimeEn,
} from "@sparcs-clubs/web/utils/Date/formatDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";

import RegistrationSignatureTag from "./RegistrationSignatureTag";

const ProfessorRegistrationReview = ({
  registrationStatusEnumId,
  isProfessorSigned,
  professorApprovalStatus,
  professorSignedAt,
  regularDeadline,
  lateSigningDeadline,
}: Pick<
  ApiReg022ResponseOk,
  | "registrationStatusEnumId"
  | "isProfessorSigned"
  | "professorApprovalStatus"
  | "professorSignedAt"
  | "regularDeadline"
  | "lateSigningDeadline"
>) => {
  const t = useTranslations("my.registration");
  const { isEnglish } = useLanguage();
  const format = isEnglish ? formatDateTimeEn : formatDateTime;
  const { color } = getTagDetail(
    registrationStatusEnumId,
    RegistrationStatusTagList,
  );
  const signatureStatus =
    professorApprovalStatus ??
    (isProfessorSigned
      ? ProfessorApprovalStatus.Approved
      : ProfessorApprovalStatus.Pending);

  return (
    <FlexWrapper direction="column" gap={12}>
      <FlexWrapper gap={24} style={{ flexWrap: "wrap" }}>
        <FlexWrapper direction="column" gap={6}>
          <Typography fs={14} lh={20} fw="MEDIUM">
            {t("executiveReview")}
          </Typography>
          <Tag color={color}>
            {t(`executiveStatus.${registrationStatusEnumId}`)}
          </Tag>
        </FlexWrapper>
        <FlexWrapper direction="column" gap={6}>
          <Typography fs={14} lh={20} fw="MEDIUM">
            {t("yourSignature")}
          </Typography>
          <RegistrationSignatureTag status={signatureStatus} />
        </FlexWrapper>
      </FlexWrapper>
      <Typography fs={14} lh={20} fw="REGULAR">
        {t("regularSignatureDeadline", {
          date: regularDeadline
            ? format(new Date(regularDeadline))
            : t("deadlineNotConfigured"),
        })}
      </Typography>
      <Typography fs={14} lh={20} fw="REGULAR">
        {t("lateSignatureDeadline", {
          date: lateSigningDeadline
            ? format(new Date(lateSigningDeadline))
            : t("deadlineNotConfigured"),
        })}
      </Typography>
      {professorSignedAt && (
        <Typography fs={14} lh={20} fw="REGULAR">
          {t("signatureRecordedAt", {
            date: format(new Date(professorSignedAt)),
          })}
        </Typography>
      )}
    </FlexWrapper>
  );
};

export default ProfessorRegistrationReview;
