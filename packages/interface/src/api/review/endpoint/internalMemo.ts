import { HttpStatusCode } from "axios";
import { z } from "zod";

const empty = z.object({});

export const REVIEW_INTERNAL_MEMO_MAX_LENGTH = 1000;

const zReviewInternalMemoBody = z.object({
  content: z.string().trim().min(1).max(REVIEW_INTERNAL_MEMO_MAX_LENGTH),
});

const zReviewInternalMemoResponse = z.object({
  memo: z
    .object({
      content: z.string(),
      updatedAt: z.coerce.date(),
      updatedBy: z.string(),
    })
    .nullable(),
});

export type ReviewInternalMemoKind = "activity" | "funding";
export type ReviewInternalMemoBody = z.infer<typeof zReviewInternalMemoBody>;
export type ReviewInternalMemoResponse = z.infer<
  typeof zReviewInternalMemoResponse
>;

const internalMemo = {
  url: (kind: ReviewInternalMemoKind, id: number | ":id") =>
    `/executive/reviews/${kind}/${id}/internal-memo`,
  requestParam: z.object({ id: z.coerce.number().int().positive() }),
  requestQuery: empty,
  requestBody: empty,
  responseBodyMap: { [HttpStatusCode.Ok]: zReviewInternalMemoResponse },
  responseErrorMap: {},
} as const;

export const getReviewInternalMemo = {
  ...internalMemo,
  method: "GET",
} as const;

export const putReviewInternalMemo = {
  ...internalMemo,
  method: "PUT",
  requestBody: zReviewInternalMemoBody,
} as const;

export const deleteReviewInternalMemo = {
  ...internalMemo,
  method: "DELETE",
  responseBodyMap: { [HttpStatusCode.Ok]: empty },
} as const;
