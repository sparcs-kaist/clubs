import { HttpStatusCode } from "axios";
import { z } from "zod";

export const zOfficeDate = z
  .string()
  .regex(/^[1-9]\d{3}-\d{2}-\d{2}$/)
  .refine(value => {
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return false;
    return date.toISOString().slice(0, 10) === value;
  }, "유효한 날짜를 입력해주세요.");

const zOfficeTime = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const zOfficeTimestamp = z.union([
  z.string().datetime(),
  z.date().transform(date => date.toISOString()),
]);

export const zOfficeHour = z.object({
  date: zOfficeDate,
  opensAt: zOfficeTimestamp,
  closesAt: zOfficeTimestamp,
  isClosed: z.boolean(),
  version: z.coerce.number().int().positive(),
});

export type OfficeHour = z.infer<typeof zOfficeHour>;

const zOfficeDateRange = z
  .object({ from: zOfficeDate, to: zOfficeDate })
  .refine(({ from, to }) => {
    const duration = Date.parse(to) - Date.parse(from);
    return duration >= 0 && duration < 366 * 86_400_000;
  }, "조회·생성 기간은 최대 366일입니다.");

const zOfficeHourInput = z
  .object({
    openTime: zOfficeTime,
    closeTime: zOfficeTime,
    isClosed: z.boolean(),
  })
  .refine(({ openTime, closeTime }) => openTime < closeTime, {
    message: "종료 시각은 시작 시각보다 늦어야 합니다.",
    path: ["closeTime"],
  });

export type OfficeDateRange = z.infer<typeof zOfficeDateRange>;
export type OfficeHourInput = z.infer<typeof zOfficeHourInput>;

const empty = z.object({});
const officeHoursList = {
  method: "GET",
  requestParam: empty,
  requestQuery: zOfficeDateRange,
  requestBody: empty,
  responseBodyMap: {
    [HttpStatusCode.Ok]: z.object({ items: z.array(zOfficeHour) }),
  },
  responseErrorMap: {},
} as const;

export const apiOfh001 = {
  ...officeHoursList,
  url: () => "/office-hours",
} as const;

export const apiOfh002 = {
  ...officeHoursList,
  url: () => "/executive/office-hours",
} as const;

export const apiOfh003 = {
  url: () => "/executive/office-hours/generate",
  method: "POST",
  requestParam: empty,
  requestQuery: empty,
  requestBody: zOfficeDateRange,
  responseBodyMap: {
    [HttpStatusCode.Created]: z.object({
      createdCount: z.coerce.number().int().nonnegative(),
    }),
  },
  responseErrorMap: {},
} as const;

export const apiOfh004 = {
  url: (date: string) => `/executive/office-hours/${date}`,
  method: "PUT",
  requestParam: z.object({ date: zOfficeDate }),
  requestQuery: empty,
  requestBody: zOfficeHourInput,
  responseBodyMap: {
    [HttpStatusCode.Ok]: z.object({ officeHour: zOfficeHour }),
  },
  responseErrorMap: {},
} as const;
