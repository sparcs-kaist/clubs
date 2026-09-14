import { formatDotDate } from "@sparcs-clubs/web/utils/Date/formatDate";
import {
  getLocalStorageItem,
  removeLocalStorageItem,
  setLocalStorageItem,
} from "@sparcs-clubs/web/utils/localStorage";

const storageKey = (userId: number) =>
  `professor-pending-approval-hidden-date:${userId}`;

export const isProfessorApprovalNoticeHidden = (
  userId: number,
  now = new Date(),
): boolean => {
  try {
    const key = storageKey(userId);
    const hiddenDate = getLocalStorageItem(key);
    if (hiddenDate === null) return false;
    if (hiddenDate === formatDotDate(now)) return true;
    removeLocalStorageItem(key);
  } catch {
    // Storage restrictions must not prevent professors from approving documents.
  }
  return false;
};

export const hideProfessorApprovalNoticeToday = (
  userId: number,
  now = new Date(),
): void => {
  try {
    setLocalStorageItem(storageKey(userId), formatDotDate(now));
  } catch {
    // The modal can still close for this visit when storage is unavailable.
  }
};
