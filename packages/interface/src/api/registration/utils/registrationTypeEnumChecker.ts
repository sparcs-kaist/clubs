import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

/**
 * @description 인터페이스에서의 RegistrationTypeEnum에 따른 clubId와 clubRuleFileId 존재 여부 검사 규칙입니다.
 */
const registrationTypeEnumChecker = (param: {
  registrationTypeEnumId: RegistrationTypeEnum;
  clubId?: number | null;
  activityPlanFileId?: string;
  clubRuleFileId?: string;
}): boolean => {
  switch (param.registrationTypeEnumId) {
    case RegistrationTypeEnum.NewProvisional:
      if (param.clubId !== null && param.clubId !== undefined) return false; // clubId는 null이어야 한다
      if (param.activityPlanFileId === undefined) return false; // activityPlanFileId는 반드시 있어야 한다
      if (param.clubRuleFileId !== undefined) return false; // clubRuleFileId는 없어야 한다
      break;
    case RegistrationTypeEnum.ReProvisional:
      if (param.clubId === undefined || param.clubId === null) return false;
      if (param.activityPlanFileId === undefined) return false;
      if (param.clubRuleFileId !== undefined) return false;
      break;
    case RegistrationTypeEnum.Promotional:
      if (param.clubId === undefined || param.clubId === null) return false;
      if (param.activityPlanFileId === undefined) return false;
      if (param.clubRuleFileId === undefined) return false;
      break;
    case RegistrationTypeEnum.Renewal:
      if (param.clubId === undefined || param.clubId === null) return false;
      if (param.clubRuleFileId !== undefined) return false;
      break;
    default:
      break;
  }
  return true;
};

export default registrationTypeEnumChecker;
