import { ActivityStatusEnum } from "@clubs/domain/activity/activity";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";
import { ProfessorEnum } from "@clubs/interface/common/enum/user.enum";

import { FileDetail } from "@sparcs-clubs/web/common/components/File/attachment";

export enum RegistrationType {
  Renewal = "renewalRegistration",
  Promotional = "promotionalRegistration",
  Provisional = "provisionalRegistration",
}

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

  professor?: ProfessorInfo;
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
  professor?: ProfessorInfo;
}

export interface ProfessorInfo {
  name: string;
  email: string;
  professorEnumId: ProfessorEnum;
}

export interface Duration {
  startTerm: Date | null;
  endTerm: Date | null;
}

export type ActivityReport = {
  id: number;
  name: string;
  activityTypeEnumId: number;
  activityStatusEnumId: ActivityStatusEnum;
  durations: Duration[];
};
