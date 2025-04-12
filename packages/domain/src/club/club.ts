import { z } from "zod";

import {
  zDivision,
  zDivisionResponse,
  zDivisionSummary,
  zDivisionSummaryResponse,
} from "@clubs/domain/club/division";
import { zId } from "@clubs/domain/common/id";
import { zSemester } from "@clubs/domain/semester/semester";
import { zProfessor } from "@clubs/domain/user/professor";
import { zStudent } from "@clubs/domain/user/student";

export enum ClubTypeEnum {
  Regular = 1, // 정동아리
  Provisional, // 가동아리
}

export enum ClubDelegateEnum {
  Representative = 1, // 대표자
  Delegate1, // 대의원 1
  Delegate2, // 대의원 2
}

export enum ClubBuildingEnum {
  Taeul = 1, // 태울관(N13)
  Store, // 매점건물, 학부학생회관별관(N12)
  Post, // 우체국건물, 학부학생회관(N11)
  Sports, // 스포츠컴플렉스(N10)
}

const zClubRoom = z.object({
  id: zId,
  clubBuildingEnum: z.nativeEnum(ClubBuildingEnum),
  location: z.string().nullable(),
  password: z.string().nullable(),
  semester: zSemester.pick({ id: true }),
  startTerm: z.date(),
  endTerm: z.date().nullable(),
});

const zClubDelegate = z.object({
  id: zId,
  student: zStudent.pick({ id: true }),
  clubDelegateEnum: z.nativeEnum(ClubDelegateEnum),
  startTerm: z.date(),
  endTerm: z.date().nullable(),
});

export const zClub = z.object({
  id: zId.openapi({
    description: "동아리 ID",
    examples: [1, 2, 3],
  }),
  // plain schema
  nameKr: z.string().max(255).min(1).openapi({
    description: "동아리의 한국어 이름입니다.",
    example: "술박스",
  }),
  nameEn: z.string().max(255).min(1).openapi({
    description: "동아리의 영어 이름입니다.",
    example: "sulbox",
  }),
  description: z.string().nullable(),
  foundingYear: z.number(),
  // clubT schema
  typeEnum: z.nativeEnum(ClubTypeEnum),
  characteristicKr: z.string().max(30).nullable(),
  characteristicEn: z.string().max(30).nullable(),
  semester: zSemester.pick({ id: true }),
  clubRoom: zClubRoom.pick({ id: true }).nullable(),
  // delegate schema
  clubRepresentative: zClubDelegate,
  clubDelegate1: zClubDelegate.nullable(),
  clubDelegate2: zClubDelegate.nullable(),
  // division schema
  division: zDivision.pick({ id: true }),
  professor: zProfessor.pick({ id: true }).nullable(),
});

// TODO: 수정 필요
export const zClubSummary = zClub
  .pick({
    id: true,
    nameEn: true,
    typeEnum: true,
    division: true,
  })
  .extend({
    name: z.string().max(30).min(1),
  });

export const zClubSummaryResponse = zClubSummary.extend({
  division: zDivisionSummaryResponse,
});

export const zClubDelegateResponse = zClubDelegate.extend({
  student: zStudent,
});

export const zClubResponse = zClub.extend({
  semester: zSemester,
  clubRoom: zClubRoom.nullable(),
  clubRepresentative: zClubDelegateResponse,
  clubDelegate1: zClubDelegateResponse.nullable(),
  clubDelegate2: zClubDelegateResponse.nullable(),
  division: zDivisionResponse,
  professor: zProfessor.nullable(),
});

export type IClubSummary = z.infer<typeof zClubSummary>;
export type IClubSummaryResponse = z.infer<typeof zClubSummaryResponse>;
export type IDivisionSummary = z.infer<typeof zDivisionSummary>;
export type IClub = z.infer<typeof zClub>;
export type IClubResponse = z.infer<typeof zClubResponse>;
