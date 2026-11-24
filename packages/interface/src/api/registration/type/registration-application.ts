import { z } from "zod";

import { zUserName } from "@clubs/interface/common/commonString";

export const getRegistrationActivityFieldError = (value?: string) => {
  if (!value) return "required";
  const withoutWhitespace = value.replace(/\s/g, "");
  if (!withoutWhitespace) return "required";

  if ([...value].length > 40 || [...withoutWhitespace].length > 30) {
    return "tooLong";
  }

  return null;
};

export const zRegistrationActivityField = z
  .string()
  .superRefine((value, ctx) => {
    const error = getRegistrationActivityFieldError(value);
    if (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          error === "required"
            ? "An activity field is required"
            : "Must be at most 40 characters including whitespace and 30 excluding whitespace",
      });
    }
  });

export const zRegistrationProfessorEmail = z
  .string()
  .max(255)
  .email()
  .refine(email => email.endsWith("@kaist.ac.kr"), {
    message: "Must be a valid KAIST email address",
  });

export const zRegistrationProfessor = z.object({
  name: zUserName.min(1),
  email: zRegistrationProfessorEmail,
});
