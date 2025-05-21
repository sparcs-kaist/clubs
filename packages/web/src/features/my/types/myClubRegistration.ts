import {
  RegistrationStatusEnum,
  RegistrationTypeEnum,
} from "@clubs/interface/common/enum/registration.enum";

import { ProfessorInfo } from "@sparcs-clubs/web/features/register-club/types/registerClub";

export interface MyClubRegistrationDetail {
  id: number;
  registrationStatusEnumId: RegistrationStatusEnum;
  registrationTypeEnumId: RegistrationTypeEnum;
  clubId?: number;
  clubNameKr: string;
  clubNameEn: string;
  representative: { studentNumber: number; name: string };
  phoneNumber: string;
  foundedAt: Date;
  divisionId: number;
  activityFieldKr: string;
  activityFieldEn: string;
  professor?: ProfessorInfo;
  divisionConsistency: string;
  foundationPurpose: string;
  activityPlan: string;
  activityPlanFileId?: string;
  activityPlanFileName?: string;
  clubRuleFileId?: string;
  clubRuleFileName?: string;
  externalInstructionFileId?: string;
  externalInstructionFileName?: string;
  updatedAt: Date;
  isProfessorSigned: boolean;
  comments: { content: string; createdAt: Date }[];
}
