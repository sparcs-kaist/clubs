import { TagColor } from "@sparcs-clubs/web/common/components/Tag";

export type ServiceType =
  | "rental-business"
  | "printing-business"
  | "activity-certificate"
  | "common-space";

export const ManageClubRentalBusinessStatus = {
  submit: "신청",
  cancel: "취소",
  approve: "승인",
  rent: "대여",
  return: "반납",
  overdue: "연체",
} as const;

export type ManageClubRentalBusinessStatus =
  (typeof ManageClubRentalBusinessStatus)[keyof typeof ManageClubRentalBusinessStatus];

export interface ManageClubRentalBusinessData {
  status: ManageClubRentalBusinessStatus;
  submitTime: Date;
  name: string;
  phoneNumber: string;
  rentTime: Date;
  returnTime: Date;
  rentProducts: string;
}

export const ManageClubPrintingBusinessStatus = {
  submit: "신청",
  cancel: "취소",
  approve: "승인",
  print: "출력",
  receive: "수령",
} as const;

export type ManageClubPrintingBusinessStatus =
  (typeof ManageClubPrintingBusinessStatus)[keyof typeof ManageClubPrintingBusinessStatus];

export interface ManageClubPrintingBusinessData {
  status: ManageClubPrintingBusinessStatus;
  submitTime: Date;
  name: string;
  phoneNumber: string;
  receiveTime: Date;
  printNumber: string;
}

export const ManageClubActivityCertificateStatus = {
  submit: "신청",
  cancel: "취소",
  approve: "승인",
  issue: "발급",
  reject: "반려",
} as const;

export type ManageClubActivityCertificateStatus =
  (typeof ManageClubActivityCertificateStatus)[keyof typeof ManageClubActivityCertificateStatus];

export interface ManageClubActivityCertificateData {
  status: ManageClubActivityCertificateStatus;
  submitTime: Date;
  name: string;
  phoneNumber: string;
  issueNumber: number;
  note: string;
}

export const ManageClubCommonSpaceStatus = {
  submit: "신청",
  cancel: "취소",
  use: "사용",
} as const;

export type ManageClubCommonSpaceStatus =
  (typeof ManageClubCommonSpaceStatus)[keyof typeof ManageClubCommonSpaceStatus];

export interface ManageClubCommonSpaceData {
  status: ManageClubCommonSpaceStatus;
  submitTime: Date;
  name: string;
  phoneNumber: string;
  reserveTime: Date;
  reserveStartEndHour: string;
  reserveRoom: string;
}

export interface ManageClubTagColorsInterface {
  submit: TagColor;
  cancel: TagColor;
  approve: TagColor;
  rent: TagColor;
  return: TagColor;
  print: TagColor;
  receive: TagColor;
  issue: TagColor;
  reject: TagColor;
  use: TagColor;
  overdue: TagColor;
}
