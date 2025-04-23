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

const computeErrorMessage = (data: ValidationData) => {
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
    return "대표자 전화번호를 입력해주세요";
  }
  if (!activityFieldKr) {
    return "활동 분야(국문)를 입력해주세요";
  }
  if (activityFieldKr.length > 255) {
    return "활동 분야(국문)는 255자 이내로 입력해주세요";
  }
  if (!activityFieldEn) {
    return "활동 분야(영문)를 입력해주세요";
  }
  if (activityFieldEn.length > 255) {
    return "활동 분야(영문)는 255자 이내로 입력해주세요";
  }
  if (!foundedAt) {
    return "설립 연(월)을 입력해주세요";
  }
  if (!divisionId) {
    return "분과를 선택해주세요";
  }
  if (!divisionConsistency) {
    return "분과 정합성을 입력해주세요";
  }
  if (!foundationPurpose) {
    return "설립 목적을 입력해주세요";
  }
  if (!activityPlan) {
    return "주요 활동 계획을 입력해주세요";
  }
  if (type !== RegistrationTypeEnum.Renewal) {
    // 활동 계획서는 신규 등록, 가등록에서만 받음
    if (!activityPlanFile) return "활동 계획서 파일을 업로드해주세요";
  }
  if (type === RegistrationTypeEnum.Promotional) {
    // 동아리 회칙은 신규 등록에서만 받음
    if (!clubRuleFile) return "동아리 회칙 파일을 업로드해주세요";
  }
  if (!isAgreed) {
    return "동아리 연합 회칙 확인 후 동의해주세요";
  }
  return "";
};

export default computeErrorMessage;
