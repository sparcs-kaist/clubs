import { z } from "zod";

import { ActivityDeadlineEnum } from "@sparcs-clubs/interface/common/enum/activity.enum";
import { FundingDeadlineEnum } from "@sparcs-clubs/interface/common/enum/funding.enum";
import { RegistrationDeadlineEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";
import { zId } from "@sparcs-clubs/interface/common/type/id.type";

import { zSemester } from "./semester.type";

export const zActivityDeadline = z.object({
  id: zId,
  semester: zSemester.pick({ id: true }),
  deadlineEnum: z.nativeEnum(ActivityDeadlineEnum),
  startDate: z.date(),
  endDate: z.date(),
});

export const zFundingDeadline = z.object({
  id: zId,
  semester: zSemester.pick({ id: true }),
  deadlineEnum: z.nativeEnum(FundingDeadlineEnum),
  startDate: z.date(),
  endDate: z.date(),
});

export const zRegistrationDeadline = z.object({
  id: zId,
  semester: zSemester.pick({ id: true }),
  deadlineEnum: z.nativeEnum(RegistrationDeadlineEnum),
  startDate: z.date(),
  endDate: z.date(),
});

export type IActivityDeadline = z.infer<typeof zActivityDeadline>;
export type IFundingDeadline = z.infer<typeof zFundingDeadline>;
export type IRegistrationDeadline = z.infer<typeof zRegistrationDeadline>;
