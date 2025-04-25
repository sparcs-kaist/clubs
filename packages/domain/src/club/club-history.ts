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
  id: zId,
  clubBuildingEnum: z.nativeEnum(ClubBuildingEnum),
  location: z.string().nullable(),
  password: z.string().nullable(),
  semester: zSemester.pick({ id: true }),
  startTerm: z.date(),
  endTerm: z.date().nullable(),
});

export const zClubHistory = z.object({
  // clubT schema
  typeEnum: z.nativeEnum(ClubTypeEnum),
  characteristicKr: z.string().max(30).nullable(),
  characteristicEn: z.string().max(30).nullable(),
  semester: zSemester.pick({ id: true }),
  clubRoom: zClubRoom.pick({ id: true }).nullable(),

  // division schema
  professor: z.object({ id: zProfessor.shape.id }).nullable(),
});

export type IClubHistory = z.infer<typeof zClubHistory>;
