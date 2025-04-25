import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { zId } from "@clubs/domain/common/id";
import { zSemester } from "@clubs/domain/semester/semester";
import { zProfessor } from "@clubs/domain/user/professor";

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

//TODO: Club Room 관련 Feature 추가 후 별도 모델 파일로 분리
const zClubRoom = z.object({
  id: zId.openapi({
    description: "동아리방 ID",
    examples: [1, 2, 3],
  }),
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
  semester: z.object({ id: zSemester.shape.id }),
  startTerm: z.date(),
  endTerm: z.date().nullable(),
});

export const zClubHistory = z.object({
  // clubT schema
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
      examples: ["요리", "서브컬처"],
    }),
  characteristicEn: z
    .string()
    .max(30)
    .nullable()
    .openapi({
      description: "동아리 성격 영문",
      examples: ["cooking", "Animation and subculture"],
    }),
  semester: zSemester.pick({ id: true }),
  clubRoom: zClubRoom.pick({ id: true }).nullable(),

  // division schema
  professor: z.object({ id: zProfessor.shape.id }).nullable(),
});

export type IClubHistory = z.infer<typeof zClubHistory>;
