import { isAxiosError } from "axios";
import { z } from "zod";

import { RegistrationErrorCode } from "@clubs/interface/api/registration/type/registration-error";

const messages: Record<RegistrationErrorCode, string> = {
  [RegistrationErrorCode.RegistrationPeriodClosed]:
    "동아리 등록 신청 기간이 아닙니다. 신청 기간을 확인해주세요.",
  [RegistrationErrorCode.ClubAlreadyApplied]:
    "이 동아리의 이번 학기 등록 신청이 이미 존재합니다. 기존 신청 내역을 확인해주세요.",
  [RegistrationErrorCode.StudentAlreadyApplied]:
    "이번 학기에 제출한 등록 신청이 있습니다. 마이페이지에서 기존 신청 내역을 확인해주세요.",
  [RegistrationErrorCode.AlreadyClubDelegate]:
    "이미 동아리 대표자·대의원으로 등록되어 있어 신규 가등록을 신청할 수 없습니다. 동아리 등록 화면에서 신청 가능한 유형을 확인해주세요.",
  [RegistrationErrorCode.NotClubDelegate]:
    "이 동아리의 대표자·대의원만 신청할 수 있습니다. 현재 대표자·대의원 정보를 확인해주세요.",
  [RegistrationErrorCode.NotEligible]:
    "선택한 유형의 등록 조건을 충족하지 않습니다. 동아리 등록 화면에서 신청 가능한 유형을 확인해주세요.",
  [RegistrationErrorCode.InvalidRequest]:
    "신청 유형과 입력 내용이 일치하지 않습니다. 동아리 등록 화면에서 올바른 서류를 선택해주세요.",
  [RegistrationErrorCode.InvalidClub]:
    "신청할 동아리를 찾을 수 없습니다. 동아리 등록 화면에서 대상을 다시 확인해주세요.",
  [RegistrationErrorCode.MissingAttachment]:
    "필수 첨부파일이 누락되었습니다. 해당 서류의 필수 파일을 첨부해주세요.",
  [RegistrationErrorCode.InvalidAttachment]:
    "첨부파일을 확인할 수 없습니다. 파일을 다시 첨부해주세요.",
  [RegistrationErrorCode.ClubNameAlreadyExists]:
    "동일한 국문 또는 영문 이름의 동아리가 이미 존재합니다. 기존 동아리인지 확인해주세요.",
  [RegistrationErrorCode.ApplicationNotEditable]:
    "수정할 수 없는 신청입니다. 신청 내역에서 현재 처리 상태를 확인해주세요.",
};

const errorResponse = z.object({
  message: z.object({ code: z.nativeEnum(RegistrationErrorCode) }),
});
const validationResponse = z.object({
  message: z
    .array(
      z.object({ path: z.array(z.union([z.string(), z.coerce.number()])) }),
    )
    .min(1),
});
const fieldLabels: Record<string, string> = {
  clubId: "동아리",
  registrationTypeEnumId: "신청 유형",
  clubNameKr: "동아리명(국문)",
  clubNameEn: "동아리명(영문)",
  phoneNumber: "대표자 전화번호",
  foundedAt: "설립일",
  divisionId: "분과",
  activityFieldKr: "활동 분야(국문)",
  activityFieldEn: "활동 분야(영문)",
  professor: "지도교수 정보",
  divisionConsistency: "분과 적합성",
  foundationPurpose: "설립 목적",
  activityPlan: "활동 계획",
  activityPlanFileId: "활동 계획서 파일",
  clubRuleFileId: "동아리 회칙 파일",
  externalInstructionFileId: "외부 강사 지도 계획서 파일",
};
const legacyCodes: Record<string, RegistrationErrorCode> = {
  "your club request already exists": RegistrationErrorCode.ClubAlreadyApplied,
  "your request already exists": RegistrationErrorCode.StudentAlreadyApplied,
  "Student is delegate of the club": RegistrationErrorCode.AlreadyClubDelegate,
  "Student is not delegate of the club": RegistrationErrorCode.NotClubDelegate,
  "The clubId is not eligible for promotional registration":
    RegistrationErrorCode.NotEligible,
};

export const getRegistrationErrorMessage = (error: unknown): string => {
  const uncertain =
    "신청 처리 결과를 확인하지 못했습니다. 신청 내역을 확인한 뒤 다시 시도해주세요.";
  if (!isAxiosError(error)) return uncertain;
  if (!error.response) return uncertain;
  if (error.response.status >= 500) return uncertain;
  if (error.response.status === 401)
    return "로그인이 만료되었습니다. 다시 로그인한 뒤 신청 내역을 확인해주세요.";
  if (error.response.status === 403)
    return "등록 신청 권한이 없습니다. 로그인한 계정과 대표자·대의원 정보를 확인해주세요.";

  const knownError = errorResponse.safeParse(error.response.data);
  if (knownError.success) return messages[knownError.data.message.code];
  const validation = validationResponse.safeParse(error.response.data);
  if (validation.success) {
    const labels = [
      ...new Set(
        validation.data.message.map(issue =>
          Object.hasOwn(fieldLabels, String(issue.path[0]))
            ? fieldLabels[String(issue.path[0])]
            : "신청 유형 및 필수 입력값",
        ),
      ),
    ];
    return `다음 항목의 입력값을 확인해주세요: ${labels.join(", ")}.`;
  }
  const legacy = z
    .object({ message: z.string() })
    .safeParse(error.response.data);
  if (legacy.success) {
    const code = Object.hasOwn(legacyCodes, legacy.data.message)
      ? legacyCodes[legacy.data.message]
      : undefined;
    if (code) return messages[code];
  }
  return uncertain;
};
