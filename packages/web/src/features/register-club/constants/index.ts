import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

// 영문, 숫자, 특수문자, 공백이 허용되는 정규식(한글 안됨)
export const notAllowKrRegx = /^[\x20-\x7E]+$/;
export const regxErrorMessage =
  "영어 대소문자, 숫자, 특수문자, 공백만 입력 가능합니다.";

export const registerClubOptions = [
  {
    type: RegistrationTypeEnum.Renewal,
    path: "/register-club/renewal",
    requirements: ["renewal"],
  },
  {
    type: RegistrationTypeEnum.Promotional,
    path: "/register-club/promotional",
    requirements: ["promotionalProvisional", "promotionalCancelled"],
  },
  {
    type: RegistrationTypeEnum.NewProvisional,
    path: "/register-club/provisional/new",
    requirements: ["newProvisional"],
  },
  {
    type: RegistrationTypeEnum.ReProvisional,
    path: "/register-club/provisional/renewal",
    requirements: ["reProvisional"],
  },
] as const;

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
