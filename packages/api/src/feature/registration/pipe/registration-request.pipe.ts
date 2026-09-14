import { ArgumentMetadata, HttpException, HttpStatus } from "@nestjs/common";
import { ZodError } from "zod";

import { RegistrationErrorCode } from "@clubs/interface/api/registration/type/registration-error";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";

export class RegistrationRequestPipe extends ZodPipe {
  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      return super.transform(value, metadata);
    } catch (error) {
      if (!(error instanceof ZodError)) throw error;

      const issue = error.issues[0];
      if (!issue) throw error;
      const field = String(issue.path[0] ?? "");
      let code: RegistrationErrorCode;
      if (
        Object.values(RegistrationErrorCode).includes(
          issue.message as RegistrationErrorCode,
        )
      ) {
        code = issue.message as RegistrationErrorCode;
      } else if (field === "registrationTypeEnumId") {
        code = RegistrationErrorCode.InvalidRequest;
      } else if (field === "clubId") {
        code = RegistrationErrorCode.InvalidClub;
      } else if (
        [
          "activityPlanFileId",
          "clubRuleFileId",
          "externalInstructionFileId",
        ].includes(field)
      ) {
        code = RegistrationErrorCode.InvalidAttachment;
      } else {
        throw error;
      }
      throw new HttpException(
        { code, message: "신청서의 입력 내용과 첨부파일을 확인해주세요." },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
