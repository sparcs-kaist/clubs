import {
  ActivityStatusEnum,
  ProfessorApprovalStatus,
} from "@clubs/domain/activity/activity";

import { BaseActivityReport } from "./activityReport";

export interface BaseActivityReportTableData extends Pick<
  BaseActivityReport,
  "name" | "activityTypeEnumId" | "durations"
> {
  id: number;
}

export interface ActivityReportTableData extends BaseActivityReportTableData {
  activityStatusEnumId: ActivityStatusEnum;
  professorApprovalStatus: ProfessorApprovalStatus | null;
}

export interface PastActivityReportTableData extends BaseActivityReportTableData {}
