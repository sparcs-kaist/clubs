import { HttpStatusCode } from "axios";
import { z } from "zod";

import { ClubTypeEnum } from "@sparcs-clubs/interface/common/enum/club.enum";
import { zId } from "@sparcs-clubs/interface/common/type/id.type";

/**
 * @version v0.1
 * @description 집행부원을 위한 동아리별 활동 보고서 내역을 조회합니다.
 */

const url = () => `/executive/activities/clubs`;
const method = "GET";

const requestParam = z.object({});

const requestQuery = z.object({});

const requestBody = z.object({});

const responseBodyMap = {
  [HttpStatusCode.Ok]: z.object({
    items: z.array(
      z.object({
        clubId: zId,
        clubTypeEnum: z.nativeEnum(ClubTypeEnum),
        divisionName: z.string().max(10),
        clubNameKr: z.string().max(30),
        clubNameEn: z.string().max(30),
        advisor: z.string().max(255).optional(),
        pendingActivitiesCount: z.coerce.number().int().min(0),
        approvedActivitiesCount: z.coerce.number().int().min(0),
        rejectedActivitiesCount: z.coerce.number().int().min(0),
        chargedExecutive: z
          .object({
            id: zId,
            name: z.string().max(30),
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
            clubNameKr: z.string().max(30),
            clubNameEn: z.string().max(30),
            pendingActivitiesCount: z.coerce.number().int().min(0),
            approvedActivitiesCount: z.coerce.number().int().min(0),
            rejectedActivitiesCount: z.coerce.number().int().min(0),
          }),
        ),
      }),
    ),
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
  ApiAct023RequestParam,
  ApiAct023RequestQuery,
  ApiAct023RequestBody,
  ApiAct023ResponseOk,
};
