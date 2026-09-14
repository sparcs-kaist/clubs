import { z } from "zod";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import { RegistrationErrorCode } from "../type/registration-error";

type RegistrationTypeFields = {
  registrationTypeEnumId: RegistrationTypeEnum;
  clubId?: number | null;
  activityPlanFileId?: string;
  clubRuleFileId?: string;
};

const getRegistrationTypeError = (
  param: RegistrationTypeFields,
  isUpdate = false,
): RegistrationErrorCode | undefined => {
  if (param.registrationTypeEnumId === RegistrationTypeEnum.NewProvisional) {
    if (!isUpdate && param.clubId != null) {
      return RegistrationErrorCode.InvalidClub;
    }
  } else if (param.clubId == null) {
    return RegistrationErrorCode.InvalidClub;
  }

  if (param.registrationTypeEnumId !== RegistrationTypeEnum.Renewal) {
    if (!param.activityPlanFileId)
      return RegistrationErrorCode.MissingAttachment;
  }
  if (param.registrationTypeEnumId === RegistrationTypeEnum.Promotional) {
    if (!param.clubRuleFileId) return RegistrationErrorCode.MissingAttachment;
  } else if (param.clubRuleFileId !== undefined) {
    return RegistrationErrorCode.InvalidAttachment;
  }
  return undefined;
};

export const refineRegistrationRequest = (
  param: RegistrationTypeFields,
  context: z.RefinementCtx,
  isUpdate = false,
) => {
  const errorCode = getRegistrationTypeError(param, isUpdate);
  if (errorCode) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: errorCode });
  }
};

const registrationTypeEnumChecker = (param: RegistrationTypeFields) =>
  getRegistrationTypeError(param) === undefined;

export default registrationTypeEnumChecker;
