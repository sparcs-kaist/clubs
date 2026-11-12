import { z } from "zod";

import { zOfficeDate } from "@clubs/interface/api/office-hours";
import { zKrPhoneNumber } from "@clubs/interface/common/type/phoneNumber.type";

export const zRentalStatus = z.enum([
  "RESERVED",
  "CHECKED_OUT",
  "RETURNED",
  "CANCELLED",
  "REJECTED",
]);
export const zRentalPeriodPolicy = z.enum([
  "DAYS_14",
  "SECOND_NEXT_OFFICE_HOUR",
]);
export type RentalStatus = z.infer<typeof zRentalStatus>;
export type RentalPeriodPolicy = z.infer<typeof zRentalPeriodPolicy>;

const id = z.coerce.number().int().positive();
const instant = z.union([
  z.string().datetime(),
  z.date().transform(date => date.toISOString()),
]);
const zSlotSelection = z.object({
  date: zOfficeDate,
  version: z.coerce.number().int().positive(),
});
const zRentalSlot = zSlotSelection.extend({
  opensAt: instant,
  closesAt: instant,
});
const zRentalItemFields = z.object({
  name: z.string().trim().min(1).max(100),
  totalQuantity: z.coerce.number().int().min(0).max(1000000),
  durationPolicy: zRentalPeriodPolicy,
  isActive: z.boolean(),
});
const zRentalItem = zRentalItemFields.extend({ id });
const zRentalReservation = z.object({
  id,
  clubId: id,
  clubName: z.string(),
  itemId: id,
  itemName: z.string(),
  quantity: z.coerce.number().int().positive(),
  status: zRentalStatus,
  pickup: zRentalSlot,
  return: zRentalSlot,
  regularReturnLimitDate: zOfficeDate,
  approvedReturnLimitDate: zOfficeDate.nullable(),
  durationPolicy: zRentalPeriodPolicy,
  createdAt: instant,
  checkedOutAt: instant.nullable(),
  returnedAt: instant.nullable(),
  overdue: z.boolean(),
  needsReschedule: z.boolean(),
  requiresSameDayReturn: z.boolean(),
  hasDependentPickup: z.boolean(),
  waitingForReturn: z.boolean(),
  closeReason: z.string().nullable(),
});
const zRentalExtension = z.object({
  previousReturnDate: zOfficeDate,
  newReturnDate: zOfficeDate,
  reason: z.string(),
  processedByExecutiveId: id,
  processedAt: instant,
});
const zExecutiveRentalReservation = zRentalReservation.extend({
  studentId: id,
  studentName: z.string(),
  studentNumber: z.string(),
  contactPhoneNumber: z.string(),
  purpose: z.string(),
  checkoutMemo: z.string().nullable(),
  checkedOutByExecutiveId: id.nullable(),
  returnedByExecutiveId: id.nullable(),
  extensions: z.array(zRentalExtension),
});
export type RentalItem = z.infer<typeof zRentalItem>;
export type RentalSlot = z.infer<typeof zRentalSlot>;
export type RentalSlotSelection = z.infer<typeof zSlotSelection>;
export type RentalReservation = z.infer<typeof zRentalReservation>;
export type ExecutiveRentalReservation = z.infer<
  typeof zExecutiveRentalReservation
>;

const empty = z.object({});
const byId = z.object({ id });
const reason = z.string().trim().min(1).max(500);
const pagination = z.object({
  pageOffset: z.coerce.number().int().positive().default(1),
  itemCount: z.coerce.number().int().min(1).max(100).default(30),
  status: zRentalStatus.optional(),
});
const listOf = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ items: z.array(item) });
const pageOf = <T extends z.ZodTypeAny>(item: T) =>
  listOf(item).extend({
    total: z.coerce.number().int().min(0),
    offset: z.coerce.number().int().positive(),
  });
const error = z.object({
  statusCode: z.coerce.number(),
  timestamp: instant,
  path: z.string(),
  message: z.union([
    z.string(),
    z.object({ message: z.string() }).passthrough(),
    z.array(z.object({ message: z.string() }).passthrough()),
  ]),
});

function endpoint<
  Path extends (...args: never[]) => string,
  Method extends "GET" | "POST" | "PATCH",
  Param extends z.ZodTypeAny,
  Query extends z.ZodTypeAny,
  Body extends z.ZodTypeAny,
  Code extends number,
  Response extends z.ZodTypeAny,
>(
  url: Path,
  method: Method,
  requestParam: Param,
  requestQuery: Query,
  requestBody: Body,
  code: Code,
  response: Response,
) {
  return {
    url,
    method,
    requestParam,
    requestQuery,
    requestBody,
    responseBodyMap: { [code]: response } as Record<Code, Response>,
    responseErrorMap: {
      400: error,
      401: error,
      403: error,
      404: error,
      409: error,
    },
  };
}

export const apiRentalItems = endpoint(
  () => "/rentals/items",
  "GET",
  empty,
  empty,
  empty,
  200,
  listOf(zRentalItem),
);
export const apiRentalReturnOptions = endpoint(
  (itemId: number) => `/rentals/items/${itemId}/return-options`,
  "GET",
  byId,
  z.object({ pickupDate: zOfficeDate }),
  empty,
  200,
  z.object({
    pickup: zRentalSlot,
    options: z.array(
      zRentalSlot.extend({
        availableQuantity: z.coerce.number().int().nonnegative(),
        availableWithoutSameDayReturns: z.coerce.number().int().nonnegative(),
      }),
    ),
  }),
);
export const apiRentalEligibleClubs = endpoint(
  () => "/student/rentals/eligible-clubs",
  "GET",
  empty,
  empty,
  empty,
  200,
  listOf(z.object({ id, name: z.string() })),
);
export const apiRentalsMy = endpoint(
  () => "/student/rentals",
  "GET",
  empty,
  pagination,
  empty,
  200,
  pageOf(zRentalReservation),
);
export const apiRentalMyDetail = endpoint(
  (rentalId: number) => `/student/rentals/${rentalId}`,
  "GET",
  byId,
  empty,
  empty,
  200,
  zRentalReservation,
);
export const apiRentalCreate = endpoint(
  () => "/student/rentals",
  "POST",
  empty,
  empty,
  z.object({
    clubId: id,
    itemId: id,
    quantity: z.coerce.number().int().positive(),
    pickup: zSlotSelection,
    return: zSlotSelection,
    contactPhoneNumber: zKrPhoneNumber,
    purpose: z.string().trim().min(1).max(500),
    clientRequestId: z.string().uuid(),
  }),
  201,
  zRentalReservation,
);
export const apiRentalCancel = endpoint(
  (rentalId: number) => `/student/rentals/${rentalId}/cancel`,
  "POST",
  byId,
  empty,
  empty,
  200,
  zRentalReservation,
);
export const apiRentalsExecutive = endpoint(
  () => "/executive/rentals",
  "GET",
  empty,
  pagination.extend({
    officeDate: zOfficeDate.optional(),
    overdue: z.enum(["true", "false"]).optional(),
  }),
  empty,
  200,
  pageOf(zExecutiveRentalReservation),
);
export const apiRentalExecutiveDetail = endpoint(
  (rentalId: number) => `/executive/rentals/${rentalId}`,
  "GET",
  byId,
  empty,
  empty,
  200,
  zExecutiveRentalReservation,
);

const executiveAction = <Body extends z.ZodTypeAny>(
  action: string,
  body: Body,
) =>
  endpoint(
    (rentalId: number) => `/executive/rentals/${rentalId}/${action}`,
    "POST",
    byId,
    empty,
    body,
    200,
    zExecutiveRentalReservation,
  );
export const apiRentalCheckout = executiveAction(
  "checkout",
  z.object({ memo: z.string().trim().max(500).optional() }),
);
export const apiRentalReturn = executiveAction("return", empty);
export const apiRentalExecutiveCancel = executiveAction(
  "cancel",
  z.object({ reason }),
);
export const apiRentalReject = executiveAction("reject", z.object({ reason }));
export const apiRentalExtend = executiveAction(
  "extend",
  z.object({ return: zSlotSelection, reason }),
);
export const apiRentalSchedule = endpoint(
  (rentalId: number) => `/executive/rentals/${rentalId}/schedule`,
  "PATCH",
  byId,
  empty,
  z
    .object({
      pickup: zSlotSelection.optional(),
      return: zSlotSelection.optional(),
    })
    .refine(
      value => value.pickup !== undefined || value.return !== undefined,
      "Select a pickup or return date",
    ),
  200,
  zExecutiveRentalReservation,
);
export const apiRentalItemsExecutive = endpoint(
  () => "/executive/rental-items",
  "GET",
  empty,
  empty,
  empty,
  200,
  listOf(zRentalItem),
);
export const apiRentalItemCreate = endpoint(
  () => "/executive/rental-items",
  "POST",
  empty,
  empty,
  zRentalItemFields,
  201,
  zRentalItem,
);
export const apiRentalItemUpdate = endpoint(
  (itemId: number) => `/executive/rental-items/${itemId}`,
  "PATCH",
  byId,
  empty,
  zRentalItemFields.partial(),
  200,
  zRentalItem,
);
