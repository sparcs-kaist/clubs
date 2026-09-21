// WARNING: MUST BE CALLED IN A BROWSER ENVIRONMENT

import type { ApiAut002ResponseCreated } from "@clubs/interface/api/auth/endpoint/apiAut002";

const LOCAL_STORAGE_SET_EVENT = "local-storage-set";

export const getLocalStorageItem = (key: string) => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key);
  }
  // window객체 localStorage, sessionStorage는 값이 없을때 null
  return null;
};

export const setLocalStorageItem = (key: string, value: string) => {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event(LOCAL_STORAGE_SET_EVENT));
};

export const setLoginTokens = (
  tokens: ApiAut002ResponseCreated["accessToken"],
) => {
  const accessToken =
    tokens.professor ??
    tokens.doctor ??
    tokens.masterDoctorDoctor ??
    tokens.masterDoctorMaster ??
    tokens.master ??
    tokens.undergraduate ??
    tokens.allPrograms ??
    tokens.auditor ??
    tokens.exchangeStudent ??
    tokens.employee ??
    tokens.executive ??
    "";

  localStorage.setItem("responseToken", JSON.stringify(tokens));
  setLocalStorageItem("accessToken", accessToken);
};

export const removeLocalStorageItem = (key: string) => {
  localStorage.removeItem(key);
  window.dispatchEvent(new Event(LOCAL_STORAGE_SET_EVENT));
};

export const subscribeLocalStorageSet = (callback: () => void) => {
  window.addEventListener(LOCAL_STORAGE_SET_EVENT, callback);
};

export const unsubscribeLocalStorageSet = (callback: () => void) => {
  window.removeEventListener(LOCAL_STORAGE_SET_EVENT, callback);
};
