import {
  ActivityStatusEnum,
  ActivityTypeEnum,
} from "@clubs/domain/activity/activity";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";
import { ProfessorEnum } from "@clubs/interface/common/enum/user.enum";

import { FileDetail } from "@sparcs-clubs/web/common/components/File/attachment";

export const RegistrationType = {
  Renewal: "renewalRegistration",
  Promotional: "promotionalRegistration",
  Provisional: "provisionalRegistration",
} as const;

export type RegistrationType =
  (typeof RegistrationType)[keyof typeof RegistrationType];

export type FileIdType =
  | "activityPlanFile"
  | "clubRuleFile"
  | "externalInstructionFile";

export interface RegisterClubModel {
  id: number;
  clubId?: number;
  registrationTypeEnumId: RegistrationTypeEnum;
  clubNameKr: string;
  clubNameEn: string;
  phoneNumber: string;

  foundedAt: Date;
  divisionId: number;
  activityFieldKr: string;
  activityFieldEn: string;

  professor?: ProfessorContact;
  divisionConsistency: string;
  foundationPurpose: string;
  activityPlan: string;
  activityPlanFile?: FileDetail;

  clubRuleFile?: FileDetail;

  externalInstructionFile?: FileDetail;
}

export interface ClubRegistrationInfo {
  id: number;
  clubNameKr: string;
  clubNameEn: string;
  professor?: ProfessorInfo | null;
}

export interface ProfessorContact {
  name: string;
  email: string;
}

export interface ProfessorInfo extends ProfessorContact {
  professorEnumId: ProfessorEnum | null;
}

export const toProfessorContact = (
  professor: ProfessorContact | null | undefined,
): ProfessorContact | undefined =>
  professor ? { name: professor.name, email: professor.email } : undefined;

export interface Duration {
  startTerm: Date | null;
  endTerm: Date | null;
}

export type ActivityReport = {
  id: number;
  name: string;
  activityTypeEnumId: ActivityTypeEnum;
  activityStatusEnumId: ActivityStatusEnum;
  durations: Duration[];
};
