import { addDays, subSeconds } from "date-fns";

import { Semester } from "@sparcs-clubs/web/types/semester";
import { formatDateTime } from "@sparcs-clubs/web/utils/Date/formatDate";

export const registerMemberDeadlineInfoText = (
  date: Date,
  targetSemester?: Semester,
) =>
  `현재는 ${targetSemester?.year}년 ${targetSemester?.name}학기 회원 등록 기간입니다 (신청 마감 : ${formatDateTime(subSeconds(addDays(date, 1), 1))})`;
