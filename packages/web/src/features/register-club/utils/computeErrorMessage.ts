import { getRegistrationActivityFieldError } from "@clubs/interface/api/registration/type/registration-application";
import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import { FileDetail } from "@sparcs-clubs/web/common/components/File/attachment";

interface ValidationData {
  registrationTypeEnumId: RegistrationTypeEnum;
  phoneNumber: string;
  requiresPhoneNumber?: boolean;
  activityFieldKr: string;
  activityFieldEn: string;
  foundedAt: Date;
  divisionId: number;
  divisionConsistency: string;
  foundationPurpose: string;
  activityPlan: string;
  activityPlanFile?: FileDetail;
  clubRuleFile?: FileDetail;
  isAgreed: boolean;
}

const computeErrorMessage = (
  data: ValidationData,
  translate: (key: string) => string,
) => {
  const {
    registrationTypeEnumId: type,
    phoneNumber,
    requiresPhoneNumber = true,
    activityFieldKr,
    activityFieldEn,
    foundedAt,
    divisionId,
    divisionConsistency,
    foundationPurpose,
    activityPlan,
    activityPlanFile,
    clubRuleFile,
    isAgreed,
  } = data;

  if (requiresPhoneNumber && !phoneNumber) {
    return translate("phoneRequired");
  }
  const activityFieldKrError =
    getRegistrationActivityFieldError(activityFieldKr);
  if (activityFieldKrError === "required") {
    return translate("activityFieldKrRequired");
  }
  if (activityFieldKrError === "tooLong") {
    return translate("activityFieldKrTooLong");
  }
  const activityFieldEnError =
    getRegistrationActivityFieldError(activityFieldEn);
  if (activityFieldEnError === "required") {
    return translate("activityFieldEnRequired");
  }
  if (activityFieldEnError === "tooLong") {
    return translate("activityFieldEnTooLong");
  }
  if (!foundedAt) {
    return translate("foundedAtRequired");
  }
  if (!divisionId) {
    return translate("divisionRequired");
  }
  if (!divisionConsistency) {
    return translate("divisionConsistencyRequired");
  }
  if (!foundationPurpose) {
    return translate("foundationPurposeRequired");
  }
  if (!activityPlan) {
    return translate("activityPlanRequired");
  }
  if (type !== RegistrationTypeEnum.Renewal) {
    // 활동 계획서는 신규 등록, 가등록에서만 받음
    if (!activityPlanFile) return translate("activityPlanFileRequired");
  }
  if (type === RegistrationTypeEnum.Promotional) {
    // 동아리 회칙은 신규 등록에서만 받음
    if (!clubRuleFile) return translate("clubRuleFileRequired");
  }
  if (!isAgreed) {
    return translate("agreementRequired");
  }
  return "";
};

export default computeErrorMessage;
