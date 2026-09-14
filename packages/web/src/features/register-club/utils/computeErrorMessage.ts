import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import { FileDetail } from "@sparcs-clubs/web/common/components/File/attachment";

interface ValidationData {
  registrationTypeEnumId: RegistrationTypeEnum;
  phoneNumber: string;
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
  translate?: (key: string) => string,
) => {
  const {
    registrationTypeEnumId: type,
    phoneNumber,
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

  if (!phoneNumber) {
    return translate?.("phoneRequired") ?? "대표자 전화번호를 입력해주세요";
  }
  if (!activityFieldKr) {
    return (
      translate?.("activityFieldKrRequired") ?? "활동 분야(국문)를 입력해주세요"
    );
  }
  if (activityFieldKr.length > 255) {
    return (
      translate?.("activityFieldKrTooLong") ??
      "활동 분야(국문)는 255자 이내로 입력해주세요"
    );
  }
  if (!activityFieldEn) {
    return (
      translate?.("activityFieldEnRequired") ?? "활동 분야(영문)를 입력해주세요"
    );
  }
  if (activityFieldEn.length > 255) {
    return (
      translate?.("activityFieldEnTooLong") ??
      "활동 분야(영문)는 255자 이내로 입력해주세요"
    );
  }
  if (!foundedAt) {
    return translate?.("foundedAtRequired") ?? "설립 연(월)을 입력해주세요";
  }
  if (!divisionId) {
    return translate?.("divisionRequired") ?? "분과를 선택해주세요";
  }
  if (!divisionConsistency) {
    return (
      translate?.("divisionConsistencyRequired") ?? "분과 정합성을 입력해주세요"
    );
  }
  if (!foundationPurpose) {
    return (
      translate?.("foundationPurposeRequired") ?? "설립 목적을 입력해주세요"
    );
  }
  if (!activityPlan) {
    return (
      translate?.("activityPlanRequired") ?? "주요 활동 계획을 입력해주세요"
    );
  }
  if (type !== RegistrationTypeEnum.Renewal) {
    // 활동 계획서는 신규 등록, 가등록에서만 받음
    if (!activityPlanFile)
      return (
        translate?.("activityPlanFileRequired") ??
        "활동 계획서 파일을 업로드해주세요"
      );
  }
  if (type === RegistrationTypeEnum.Promotional) {
    // 동아리 회칙은 신규 등록에서만 받음
    if (!clubRuleFile)
      return (
        translate?.("clubRuleFileRequired") ??
        "동아리 회칙 파일을 업로드해주세요"
      );
  }
  if (!isAgreed) {
    return (
      translate?.("agreementRequired") ??
      "동아리 연합 회칙 확인 후 동의해주세요"
    );
  }
  return "";
};

export default computeErrorMessage;
