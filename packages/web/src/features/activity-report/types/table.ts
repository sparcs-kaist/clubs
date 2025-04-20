import { ActivityStatusEnum } from "@clubs/interface/common/enum/activity.enum";

import ProfessorApprovalEnum from "@sparcs-clubs/web/types/professorApproval";

import { BaseActivityReport } from "./activityReport";

export interface BaseActivityReportTableData
  extends Pick<
    BaseActivityReport,
    "name" | "activityTypeEnumId" | "durations"
  > {
  id: number;
}

export interface ActivityReportTableData extends BaseActivityReportTableData {
  activityStatusEnumId: ActivityStatusEnum;
  professorApproval: ProfessorApprovalEnum | null;
}

export interface ProfessorActivityReportTableData
  extends ActivityReportTableData {
  professorApproval: ProfessorApprovalEnum;
}

export interface PastActivityReportTableData
  extends BaseActivityReportTableData {}
