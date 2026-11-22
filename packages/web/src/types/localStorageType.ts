import { LOCAL_STORAGE_KEY } from "../constants/localStorage";

export type LocalStorageKeys =
  (typeof LOCAL_STORAGE_KEY)[keyof typeof LOCAL_STORAGE_KEY];
