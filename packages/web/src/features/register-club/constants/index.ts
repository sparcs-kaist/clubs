import { addDays, subSeconds } from "date-fns";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import { Semester } from "@sparcs-clubs/web/types/semester";
import { formatDateTime } from "@sparcs-clubs/web/utils/Date/formatDate";

// 영문, 숫자, 특수문자, 공백이 허용되는 정규식(한글 안됨)
export const notAllowKrRegx = /^[\x20-\x7E]+$/;
export const regxErrorMessage =
  "영어 대소문자, 숫자, 특수문자, 공백만 입력 가능합니다.";

export const registerClubDeadlineInfoText = (
  date: Date,
  targetSemester?: Semester,
) =>
  `현재는 ${targetSemester?.year}년 ${targetSemester?.name}학기 동아리 등록 기간입니다 (신청 마감 : ${formatDateTime(subSeconds(addDays(date, 1), 1))})`;

export const registerClubOptions = [
  {
    type: RegistrationTypeEnum.Renewal,
    title: "재등록",
    buttonText: ["직전 학기에 정동아리 지위를 유지했던 동아리만 등록 가능"],
  },
  {
    type: RegistrationTypeEnum.Promotional,
    title: "신규 등록",
    buttonText: [
      "2개 정규학기 이상 가등록 지위를 유지한 동아리 등록 가능",
      "등록 취소 이후 3개 정규학기 이상 지나지 않은 단체 등록 가능",
    ],
  },
  {
    type: RegistrationTypeEnum.NewProvisional,
    title: "가등록",
    buttonText: [
      "새로 동아리를 만드려는 학부 총학생회 정회원 등록 가능",
      "직전 학기에 가등록 지위를 유지한 동아리 등록 가능",
    ],
  },
];

export const advancedInfoFileUploadContent = {
  activityPlanFile: {
    title: "활동 계획서",
    content: `* 활동 목적 및 대중사업 계획을 포함한 활동 계획서 1부 제출 필수
  * 활동마다 활동명, 활동 기간, 활동 내용, 운영 예산을 포함한 자유 양식으로 제출`,
    downloadUrl:
      "https://ar-002-clubs.s3.ap-northeast-2.amazonaws.com/uploads/2024-03-02T05-03-16.387Z_%5B%C3%A1%C2%84%C2%8B%C3%A1%C2%85%C2%A3%C3%A1%C2%86%C2%BC%C3%A1%C2%84%C2%89%C3%A1%C2%85%C2%B5%C3%A1%C2%86%C2%A8%5D%20%C3%A1%C2%84%C2%92%C3%A1%C2%85%C2%AA%C3%A1%C2%86%C2%AF%C3%A1%C2%84%C2%83%C3%A1%C2%85%C2%A9%C3%A1%C2%86%C2%BC%20%C3%A1%C2%84%C2%80%C3%A1%C2%85%C2%A8%C3%A1%C2%84%C2%92%C3%A1%C2%85%C2%AC%C3%A1%C2%86%C2%A8%C3%A1%C2%84%C2%89%C3%A1%C2%85%C2%A5.docx",
    downloadFileName: "[양식] 활동 계획서.docx",
  },
  clubRuleFile: {
    title: "동아리 회칙",
    downloadUrl:
      "https://ar-002-clubs.s3.ap-northeast-2.amazonaws.com/uploads/2024-03-02T05-03-21.907Z_%5B%C3%A1%C2%84%C2%8B%C3%A1%C2%85%C2%A3%C3%A1%C2%86%C2%BC%C3%A1%C2%84%C2%89%C3%A1%C2%85%C2%B5%C3%A1%C2%86%C2%A8%5D%20%C3%A1%C2%84%C2%83%C3%A1%C2%85%C2%A9%C3%A1%C2%86%C2%BC%C3%A1%C2%84%C2%8B%C3%A1%C2%85%C2%A1%C3%A1%C2%84%C2%85%C3%A1%C2%85%C2%B5%20%C3%A1%C2%84%C2%92%C3%A1%C2%85%C2%AC%C3%A1%C2%84%C2%8E%C3%A1%C2%85%C2%B5%C3%A1%C2%86%C2%A8%20%C3%A1%C2%84%C2%90%C3%A1%C2%85%C2%A6%C3%A1%C2%86%C2%B7%C3%A1%C2%84%C2%91%C3%A1%C2%85%C2%B3%C3%A1%C2%86%C2%AF%C3%A1%C2%84%C2%85%C3%A1%C2%85%C2%B5%C3%A1%C2%86%C2%BA.docx",
    downloadFileName: "[양식] 동아리 회칙.docx",
  },
  externalInstructionFile: {
    title: "(선택) 외부 강사 지도 계획서",
    content: "* 외부 강사가 직접 작성하여 제출",
    downloadUrl:
      "https://ar-002-clubs.s3.ap-northeast-2.amazonaws.com/uploads/2024-03-02T05-03-19.060Z_%5B%C3%A1%C2%84%C2%8B%C3%A1%C2%85%C2%A3%C3%A1%C2%86%C2%BC%C3%A1%C2%84%C2%89%C3%A1%C2%85%C2%B5%C3%A1%C2%86%C2%A8%5D%20%C3%A1%C2%84%C2%92%C3%A1%C2%85%C2%A1%C3%A1%C2%86%C2%A8%C3%A1%C2%84%C2%89%C3%A1%C2%85%C2%A2%C3%A1%C2%86%C2%BC%20%C3%A1%C2%84%C2%8C%C3%A1%C2%85%C2%B5%C3%A1%C2%84%C2%83%C3%A1%C2%85%C2%A9%C3%A1%C2%84%C2%80%C3%A1%C2%85%C2%A8%C3%A1%C2%84%C2%92%C3%A1%C2%85%C2%AC%C3%A1%C2%86%C2%A8%C3%A1%C2%84%C2%89%C3%A1%C2%85%C2%A5%28%C3%A1%C2%84%C2%8B%C3%A1%C2%85%C2%AC%C3%A1%C2%84%C2%87%C3%A1%C2%85%C2%AE%C3%A1%C2%84%C2%80%C3%A1%C2%85%C2%A1%C3%A1%C2%86%C2%BC%C3%A1%C2%84%C2%89%C3%A1%C2%85%C2%A1%C3%A1%C2%84%C2%8B%C3%A1%C2%85%C2%AD%C3%A1%C2%86%C2%BC%29.docx",
    downloadFileName: "[양식] 학생 지도계획서(외부강사용).docx",
  },
};
