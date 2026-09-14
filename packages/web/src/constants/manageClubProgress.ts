import type { useTranslations } from "next-intl";

import { ActivityCertificateOrderStatusEnum } from "@clubs/interface/common/enum/activityCertificate.enum";
import { CommonSpaceUsageOrderStatusEnum } from "@clubs/interface/common/enum/commonSpace.enum";
import { PromotionalPrintingOrderStatusEnum } from "@clubs/interface/common/enum/promotionalPrinting.enum";
import { RentalOrderStatusEnum } from "@clubs/interface/common/enum/rental.enum";

import {
  ProgressCheckSectionStatusEnum,
  StatusAndDate,
} from "../common/components/ProgressStatus/_atomic/progressCheckStationStatus";

type ProgressTranslator = ReturnType<
  typeof useTranslations<"my.services.progress">
>;

interface ManageProgress {
  labels: string[];
  progress: StatusAndDate[];
  infoText?: string;
}

export const manageRentalProgress = (
  status: RentalOrderStatusEnum,
  t: ProgressTranslator,
): ManageProgress => {
  switch (status) {
    case RentalOrderStatusEnum.Applied:
      return {
        labels: [
          t("requested"),
          t("associationPending"),
          t("rentalPending"),
          t("returnPending"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
        infoText: t("cancelBeforeApproval"),
      };
    case RentalOrderStatusEnum.Approved:
      return {
        labels: [
          t("requested"),
          t("associationApproved"),
          t("rentalPending"),
          t("returnPending"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
        // TODO: 날짜 넣기
        infoText: t("rentalAvailable"),
      };
    case RentalOrderStatusEnum.Rented:
      return {
        labels: [
          t("requested"),
          t("associationApproved"),
          t("rented"),
          t("returnPending"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
        // TODO: 날짜 넣기
        infoText: t("returnBy"),
      };
    case RentalOrderStatusEnum.Returned:
      return {
        labels: [
          t("requested"),
          t("associationApproved"),
          t("rented"),
          t("returned"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
      };
    case RentalOrderStatusEnum.Rejected:
      return {
        labels: [
          t("requested"),
          t("associationRejected"),
          t("rentalPending"),
          t("returnPending"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Canceled, date: new Date() },
        ],
        // TODO: 반려사유 넣기
        infoText: t("associationReason", { reason: "어쩌고 저쩌고" }),
      };
    // TODO: 연체, 취소 만들기
    default:
      return {
        labels: [
          t("requested"),
          t("associationPending"),
          t("rentalPending"),
          t("returnPending"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
        infoText: t("cancelBeforeApproval"),
      };
  }
};

export const manageCommonSpaceProgress = (
  status: CommonSpaceUsageOrderStatusEnum,
  t: ProgressTranslator,
): ManageProgress => {
  switch (status) {
    case CommonSpaceUsageOrderStatusEnum.Applied:
      return {
        labels: [t("requested"), t("usePending")],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
        infoText: t("cancelBeforeApproval"),
      };
    case CommonSpaceUsageOrderStatusEnum.Used:
      return {
        labels: [t("requested"), t("used")],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
      };
    default: // Canceled
      return {
        labels: [t("canceled"), t("usePending")],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Canceled, date: new Date() },
        ],
      };
  }
};

export const managePrintingProgress = (
  status: PromotionalPrintingOrderStatusEnum,
  t: ProgressTranslator,
): ManageProgress => {
  switch (status) {
    case PromotionalPrintingOrderStatusEnum.Applied:
      return {
        labels: [
          t("requested"),
          t("associationPending"),
          t("printingPending"),
          t("pickupPending"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
        infoText: t("cancelBeforeApproval"),
      };
    case PromotionalPrintingOrderStatusEnum.Approved:
      return {
        labels: [
          t("requested"),
          t("associationApproved"),
          t("printingPending"),
          t("pickupPending"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
        infoText: t("pickupAt"),
      };
    case PromotionalPrintingOrderStatusEnum.Printed:
      return {
        labels: [
          t("requested"),
          t("associationApproved"),
          t("printed"),
          t("pickupPending"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
        infoText: t("pickupAt"),
      };
    case PromotionalPrintingOrderStatusEnum.Received:
      return {
        labels: [
          t("requested"),
          t("associationApproved"),
          t("printed"),
          t("received"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
      };
    // TODO: 취소, 반려 필요
    default:
      return {
        labels: [t("canceled"), t("usePending")],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Canceled, date: new Date() },
        ],
      };
  }
};

export const manageActivityCertificateProgress = (
  status: ActivityCertificateOrderStatusEnum,
  t: ProgressTranslator,
): ManageProgress => {
  switch (status) {
    case ActivityCertificateOrderStatusEnum.Applied:
      return {
        labels: [
          t("requested"),
          t("representativePending"),
          t("associationPending"),
          t("issuancePending"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
        infoText: t("representativeApprovalRequired"),
      };
    case ActivityCertificateOrderStatusEnum.Approved:
      return {
        labels: [
          t("requested"),
          t("representativeApproved"),
          t("associationPending"),
          t("issuancePending"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
      };
    case ActivityCertificateOrderStatusEnum.Issued:
      return {
        labels: [
          t("requested"),
          t("representativeApproved"),
          t("associationApproved"),
          t("issuancePending"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
        infoText: t("issuanceEmail"),
      };
    case ActivityCertificateOrderStatusEnum.Received:
      return {
        labels: [
          t("requested"),
          t("representativeApproved"),
          t("associationApproved"),
          t("issued"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
        ],
      };
    // TODO: 동아리 대표자 / 동아리 연합회 반려 분리 필요
    case ActivityCertificateOrderStatusEnum.Rejected:
      return {
        labels: [
          t("requested"),
          t("representativeRejected"),
          t("associationPending"),
          t("issuancePending"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Canceled, date: new Date() },
        ],
        infoText: t("representativeReason", { reason: "어쩌고 저쩌고" }),
      };
    default: // 동연 반려F
      return {
        labels: [
          t("requested"),
          t("representativeApproved"),
          t("associationRejected"),
          t("issuancePending"),
        ],
        progress: [
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Approved, date: new Date() },
          { status: ProgressCheckSectionStatusEnum.Canceled, date: new Date() },
        ],
        infoText: t("associationReason", { reason: "어쩌고 저쩌고" }),
      };
  }
};
