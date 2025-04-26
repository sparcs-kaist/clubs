import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";
import { zSemester } from "@clubs/domain/semester/semester";
import { zProfessor } from "@clubs/domain/user/professor";

import { zExtractId } from "../common/utils";
import { zClub } from "./club";

extendZodWithOpenApi(z);

export enum ClubTypeEnum {
  Regular = 1, // 정동아리
  Provisional, // 가동아리
}

export enum ClubBuildingEnum {
  Taeul = 1, // 태울관(N13)
  Store, // 매점건물, 학부학생회관별관(N12)
  Post, // 우체국건물, 학부학생회관(N11)
  Sports, // 스포츠컴플렉스(N10)
}

// TODO: Club Room 관련 Feature 추가 후 별도 모델 파일로 분리
// 영준이 화이팅~
export const zClubRoom = z.object({
  id: zId.openapi({
    description: "동아리방 ID",
    examples: [1, 2, 3],
  }),
  semester: zExtractId(zSemester), // Semester 별로 할 지? 아니면 기간별로 할 지 동연에 물어보기
  clubBuildingEnum: z.nativeEnum(ClubBuildingEnum).openapi({
    description:
      "동아리방이 위치한 건물 1: 태울관 2: 매점건물(N12) 3: 우체국건물(N11) 4: 스포츠컴플렉스(N10)",
    examples: [
      ClubBuildingEnum.Taeul,
      ClubBuildingEnum.Store,
      ClubBuildingEnum.Post,
      ClubBuildingEnum.Sports,
    ],
  }),
  location: z
    .string()
    .nullable()
    .openapi({
      description: "동아리방 위치(호수)",
      examples: ["1101호", "1203호"],
    }),
  password: z
    .string()
    .nullable()
    .openapi({
      description: "동아리방 비밀번호",
      examples: ["1234", "5678"],
    }),

  startTerm: z.date(),
  endTerm: z.date().nullable(),
});

export const zClubSemester = z.object({
  // ClubHistory schema
  id: zId.openapi({
    description: "동아리 학기별 정보 ID",
    examples: [1, 2, 3],
  }),
  club: zExtractId(zClub),
  semester: zExtractId(zSemester),
  typeEnum: z.nativeEnum(ClubTypeEnum).openapi({
    description: "동아리 지위 1: 정동아리 2: 가동아리",
    examples: [ClubTypeEnum.Regular, ClubTypeEnum.Provisional],
  }),
  characteristicKr: z
    .string()
    .max(30)
    .nullable()
    .openapi({
      description: "동아리 성격 국문",
      examples: ["요리", "서비스 개발"],
    }),
  characteristicEn: z
    .string()
    .max(30)
    .nullable()
    .openapi({
      description: "동아리 성격 영문",
      examples: ["cooking", "service development"],
    }),

  // division schema
  professor: zExtractId(zProfessor).nullable(),
});

export type IClubSemester = z.infer<typeof zClubSemester>;
