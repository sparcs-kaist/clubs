import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";
import { zSemester } from "@clubs/domain/semester/semester";

extendZodWithOpenApi(z);

// 활동보고서 기간 종류
// 작성 | 집행부 검토 | 수정 제출 | 이의제기
export enum ActivityDeadlineEnum {
  Writing = 1, // 작성 (동아리 신규작성 및 수정 가능)
  Executive, // 집행부 검토 (집행부 검토만 가능, 동아리 신규작성 및 수정 불가)
  Modification, // 수정 제출 (집행부 검토 가능, 동아리 신규작성 불가, 수정만 가능)
  Exception, // 이의제기 (집행부 검토만 가능, 동아리 신규작성 및 수정 불가)
}

export const zActivityDeadline = z.object({
  id: zId.openapi({
    description: "활동보고서 업무 관련 기간 ID",
  }),
  semester: z.object({ id: zSemester.shape.id }).openapi({
    description: "이 기간과 연관된 학기",
    examples: [{ id: 15 }, { id: 16 }, { id: 17 }],
  }),
  deadlineEnum: z.nativeEnum(ActivityDeadlineEnum).openapi({
    description: `활동보고서 업무 관련 기간 종류
    1: 작성(Writing)
    2: 집행부 검토(Executive)
    3: 수정 제출(Modification)
    4: 이의제기(Exception)`,
    examples: [1, 2, 3, 4],
  }),
  startTerm: z.coerce.date().openapi({
    description: "활동보고서 업무 관련 기간 시작일",
    examples: ["2023-03-01", "2024-09-01"],
  }),
  endTerm: z.coerce.date().openapi({
    description: "활동보고서 업무 관련 기간 종료일",
    examples: ["2023-03-15", "2024-09-15"],
  }),
});

export enum FundingDeadlineEnum {
  Writing = 1, // 작성
  Late, // 지연 제출기간, writing 기간 종료 후 수정제출 기간 전까지
  Modification, // 수정
  Exception, // 이의 제기
}

export const zFundingDeadline = z.object({
  id: zId.openapi({
    description: "지원금 업무 관련 기간 ID",
  }),
  semester: z.object({ id: zSemester.shape.id }).openapi({
    description: "이 기간과 연관된 학기",
    examples: [{ id: 15 }, { id: 16 }, { id: 17 }],
  }),
  deadlineEnum: z.nativeEnum(FundingDeadlineEnum).openapi({
    description: `지원금 업무 관련 기간 분류
    1: 작성(Writing)
    2: 지연 제출(Late)
    3: 수정(Modification)
    4: 이의제기(Exception)`,
    examples: [1, 2, 3, 4],
  }),
  startTerm: z.coerce.date().openapi({
    description: "지원금 업무 관련 기간 시작일",
    examples: ["2023-03-01", "2024-09-01"],
  }),
  endTerm: z.coerce.date().openapi({
    description: "지원금 업무 관련 기간 종료일",
    examples: ["2023-03-15", "2024-09-15"],
  }),
});

export enum RegistrationDeadlineEnum {
  ClubRegistrationApplication = 1, // 동아리 등록 신청 기간, 동연 요청으로 이 기간에 동아리 등롯 신청 생성/검토/수정/승인을 전부 진행합니다.
  ClubRegistrationLate, // 동아리 등록 신청 지연 제출 기간, 동아리 등록 신청 기간 종료 후 2주 정도
  StudentRegistrationApplication, // 회원 등록 신청 기간
  StudentRegistrationLate, // 회원 등록 신청 지연 제출 기간, 회원 등록 신청 기간 종료 후 2주 정도
}

export const zRegistrationDeadline = z.object({
  id: zId.openapi({
    description: "등록 업무 관련 기간 ID",
  }),
  semester: z.object({ id: zSemester.shape.id }).openapi({
    description: "이 기간과 연관된 학기",
    examples: [{ id: 15 }, { id: 16 }, { id: 17 }],
  }),
  deadlineEnum: z.nativeEnum(RegistrationDeadlineEnum).openapi({
    description: `등록 업무 관련 기간 분류
    1: 작성(ClubRegistrationApplication)
    2: 지연 제출(ClubRegistrationLate)
    3: 수정(StudentRegistrationApplication)
    4: 이의제기(StudentRegistrationLate)`,
    examples: [1, 2, 3, 4],
  }),
  startTerm: z.coerce.date().openapi({
    description: "등록 업무 관련 기간 시작일",
    examples: ["2023-03-01", "2024-09-01"],
  }),
  endTerm: z.coerce.date().openapi({
    description: "등록 업무 관련 기간 종료일",
    examples: ["2023-03-15", "2024-09-15"],
  }),
});

export type IActivityDeadline = z.infer<typeof zActivityDeadline>;
export type IFundingDeadline = z.infer<typeof zFundingDeadline>;
export type IRegistrationDeadline = z.infer<typeof zRegistrationDeadline>;
