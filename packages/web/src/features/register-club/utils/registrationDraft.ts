import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import { LOCAL_STORAGE_KEY } from "@sparcs-clubs/web/constants/localStorage";

import type { RegisterClubModel } from "../types/registerClub";

const draftKeys = {
  [RegistrationTypeEnum.Renewal]: LOCAL_STORAGE_KEY.REGISTER_CLUB_RENEWAL,
  [RegistrationTypeEnum.Promotional]:
    LOCAL_STORAGE_KEY.REGISTER_CLUB_PROMOTIONAL,
  [RegistrationTypeEnum.NewProvisional]:
    LOCAL_STORAGE_KEY.REGISTER_CLUB_NEW_PROVISIONAL,
  [RegistrationTypeEnum.ReProvisional]:
    LOCAL_STORAGE_KEY.REGISTER_CLUB_RE_PROVISIONAL,
};

export const getRegisterClubDraftKey = (type: RegistrationTypeEnum) =>
  draftKeys[type];

export const getCompatibleRegistrationDraft = (
  draft: RegisterClubModel | undefined,
  type: RegistrationTypeEnum,
): RegisterClubModel | undefined => {
  if (draft?.registrationTypeEnumId !== type) return undefined;
  return {
    ...draft,
    foundedAt: draft.foundedAt ? new Date(draft.foundedAt) : draft.foundedAt,
    clubId:
      type === RegistrationTypeEnum.NewProvisional ? undefined : draft.clubId,
  };
};
