import { z } from "zod";

import { zId } from "@sparcs-clubs/interface/common/type/id.type";

export const zDistrict = z.object({
  id: zId,
  name: z.string().max(255).min(1),
});

export const zDivision = z.object({
  id: zId,
  name: z.string().max(255).min(1),
  district: zDistrict.pick({ id: true }),
  startTerm: z.coerce.date(),
  endTerm: z.coerce.date().nullable(),
});

export const zDivisionResponse = zDivision.extend({
  district: zDistrict,
});

export const zDivisionSummary = zDivision.pick({ id: true, name: true });

export const zDivisionSummaryResponse = zDivisionSummary;

export type IDistrict = z.infer<typeof zDistrict>;
export type IDivision = z.infer<typeof zDivision>;
export type IDivisionResponse = z.infer<typeof zDivisionResponse>;
export type IDivisionSummary = z.infer<typeof zDivisionSummary>;
export type IDivisionSummaryResponse = z.infer<typeof zDivisionSummaryResponse>;
