import { useEffect, useState } from "react";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import LocalStorageUtil from "@sparcs-clubs/web/common/services/localStorageUtil";
import { LOCAL_STORAGE_KEY } from "@sparcs-clubs/web/constants/localStorage";
import { LocalStorageKeys } from "@sparcs-clubs/web/types/localStorageType";

import { RegisterClubModel } from "../types/registerClub";
import {
  getCompatibleRegistrationDraft,
  getRegisterClubDraftKey,
} from "../utils/registrationDraft";

const useRegistrationDraft = (type: RegistrationTypeEnum) => {
  const [state, setState] = useState<{
    type: RegistrationTypeEnum;
    source: LocalStorageKeys;
    draft?: RegisterClubModel;
    savedData?: RegisterClubModel;
    isModalOpen: boolean;
  }>();

  useEffect(() => {
    const storageKey = getRegisterClubDraftKey(type);
    const current = getCompatibleRegistrationDraft(
      LocalStorageUtil.get<RegisterClubModel>(storageKey),
      type,
    );
    const legacy = current
      ? undefined
      : getCompatibleRegistrationDraft(
          LocalStorageUtil.get<RegisterClubModel>(
            LOCAL_STORAGE_KEY.REGISTER_CLUB,
          ),
          type,
        );
    setState({
      type,
      source: current ? storageKey : LOCAL_STORAGE_KEY.REGISTER_CLUB,
      draft: current ?? legacy,
      isModalOpen: Boolean(current ?? legacy),
    });
  }, [type]);

  const handleConfirm = () => {
    if (!state?.draft) return;
    LocalStorageUtil.save(getRegisterClubDraftKey(type), state.draft);
    if (state.source === LOCAL_STORAGE_KEY.REGISTER_CLUB) {
      LocalStorageUtil.remove(state.source);
    }
    setState({ ...state, savedData: state.draft, isModalOpen: false });
  };

  const handleClose = () => {
    if (!state) return;
    LocalStorageUtil.remove(state.source);
    setState({ ...state, isModalOpen: false });
  };

  return {
    savedData: state?.savedData,
    isLoading: state?.type !== type,
    isModalOpen: state?.isModalOpen ?? false,
    handleConfirm,
    handleClose,
  };
};

export default useRegistrationDraft;
