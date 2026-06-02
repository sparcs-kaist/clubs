import { HttpStatusCode } from "axios";
import { z } from "zod";

import { zActivityDuration } from "@clubs/domain/semester/activity-duration";

import {
  zClubNameEn,
  zClubNameKr,
  zUserName,
} from "@clubs/interface/common/commonString";
import { ClubTypeEnum } from "@clubs/interface/common/enum/club.enum";
import { zId } from "@clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 집행부원을 위한 동아리별 활동 보고서 내역, 담당자 리스트를 조회합니다.
 */

const url = () => `/executive/activities/clubs`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({
  pageOffset: z.coerce.number().int().min(1),
  itemCount: z.coerce.number().int().min(1),
  clubName: z.string().optional(), // 검색 키워드: 동아리 이름
  executiveName: z.string().optional(), // 검색 키워드: 담당자 이름
  semesterId: zId.optional(),
});

const requestBody = z.object({});

// items 와 executiveProgresses는 각각 정렬해서 보내주기!
const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    activityDuration: zActivityDuration,
    pastActivityDurations: z.array(zActivityDuration).optional(),
    items: z.array(
      z.object({
        clubId: zId,
        clubTypeEnum: z.nativeEnum(ClubTypeEnum),
        divisionName: z.string().max(10),
        clubNameKr: zClubNameKr,
        clubNameEn: zClubNameEn,
        advisor: zUserName.optional(),
        pendingActivitiesCount: z.coerce.number().int().min(0),
        approvedActivitiesCount: z.coerce.number().int().min(0),
        rejectedActivitiesCount: z.coerce.number().int().min(0),
        professorApprovedActivitiesCount: z.coerce.number().int().min(0),
        chargedExecutive: z
          .object({
            id: zId,
            name: zUserName,
          })
          .optional(),
      }),
    ),
    executiveProgresses: z.array(
      z.object({
        executiveId: zId,
        executiveName: z.string(),
        chargedClubsAndProgresses: z.array(
          z.object({
            clubId: zId,
            clubTypeEnum: z.nativeEnum(ClubTypeEnum),
            divisionName: z.string().max(10),
            clubNameKr: zClubNameKr,
            clubNameEn: zClubNameEn,
            pendingActivitiesCount: z.coerce.number().int().min(0),
            approvedActivitiesCount: z.coerce.number().int().min(0),
            rejectedActivitiesCount: z.coerce.number().int().min(0),
          }),
        ),
      }),
    ),
    total: z.coerce.number().min(0),
    offset: z.coerce.number().min(1),
  }),
};

const responseErrorMap = {};

const apiAct023 = {
  url,
  method,
  requestParam,
  requestQuery,
  requestBody,
  responseBodyMap,
  responseErrorMap,
};

type ApiAct023RequestParam = z.infer<typeof apiAct023.requestParam>;
type ApiAct023RequestQuery = z.infer<typeof apiAct023.requestQuery>;
type ApiAct023RequestBody = z.infer<typeof apiAct023.requestBody>;
type ApiAct023ResponseOk = z.infer<(typeof apiAct023.responseBodyMap)[200]>;

export default apiAct023;

export type {
  ApiAct023RequestBody,
  ApiAct023RequestParam,
  ApiAct023RequestQuery,
  ApiAct023ResponseOk,
};
