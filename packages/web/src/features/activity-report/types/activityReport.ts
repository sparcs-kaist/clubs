import { IStudentSummary } from "@clubs/interface/api/user/type/user.type";
import {
  ActivityStatusEnum,
  ActivityTypeEnum,
} from "@clubs/interface/common/enum/activity.enum";

import { FileDetail } from "@sparcs-clubs/web/common/components/File/attachment";
import { Comment } from "@sparcs-clubs/web/types/comment";
import ProfessorApprovalEnum from "@sparcs-clubs/web/types/professorApproval";

type Duration = {
  startTerm: Date | null;
  endTerm: Date | null;
};

export interface BaseActivityReport {
  name: string;
  activityTypeEnumId: ActivityTypeEnum;
  durations: Duration[];
  location: string;
  purpose: string;
  detail: string;
  evidence: string;
  evidenceFiles: FileDetail[];
  participants: IStudentSummary[];
}

export interface CurrentActivityReport extends BaseActivityReport {
  id: number;
  clubId: number;
  updatedAt: Date;
  activityStatusEnumId: ActivityStatusEnum;
  professorApproval: ProfessorApprovalEnum | null;
  professorApprovedAt?: Date;
  comments: Comment[];
  editedAt: Date;
  commentedAt: Date | null;
}
