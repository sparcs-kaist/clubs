import { ActivityTypeEnum } from "@clubs/interface/common/enum/activity.enum";
import {
  FixtureClassEnum,
  FixtureEvidenceEnum,
  TransportationEnum,
} from "@clubs/interface/common/enum/funding.enum";

import { NO_ACTIVITY_REPORT_FUNDING } from "@sparcs-clubs/web/features/manage-club/funding/constants";
import { getActivityTypeLabel } from "@sparcs-clubs/web/types/activityType";
import { formatDate } from "@sparcs-clubs/web/utils/Date/formatDate";
import {
  classEnumMap,
  evidenceEnumMap,
  transportationEnumMap,
} from "@sparcs-clubs/web/utils/fundingEnumMap";

const labels: Record<string, string> = {
  name: "품목명",
  activityTypeEnumId: "활동 분류",
  durations: "활동 기간",
  location: "활동 장소",
  purpose: "목적",
  detail: "활동 내용",
  participants: "활동 인원",
  evidence: "증빙 부가 설명",
  evidenceFiles: "증빙 첨부 파일",
  purposeActivity: "지출 목적",
  expenditureDate: "지출 일자",
  expenditureAmount: "지출 금액",
  tradeEvidenceFiles: "거래 증빙 첨부 파일",
  tradeDetailFiles: "거래 내역 증빙 첨부 파일",
  tradeDetailExplanation: "거래 내역 증빙 설명",
  clubSupplies: "동아리 용품",
  isFixture: "비품 증빙 선택",
  fixture: "비품",
  isTransportation: "교통비 증빙 선택",
  transportation: "교통비",
  isNonCorporateTransaction: "비법인 거래 증빙 선택",
  nonCorporateTransaction: "비법인 거래",
  isFoodExpense: "식비 증빙 선택",
  foodExpense: "식비",
  isLaborContract: "근로 계약 증빙 선택",
  laborContract: "근로 계약",
  isExternalEventParticipationFee: "외부 행사 참가비 증빙 선택",
  externalEventParticipationFee: "외부 행사 참가비",
  isPublication: "발간물 증빙 선택",
  publication: "발간물",
  isProfitMakingActivity: "수익 사업 증빙 선택",
  profitMakingActivity: "수익 사업",
  isJointExpense: "공동 경비 증빙 선택",
  jointExpense: "공동 경비",
  isEtcExpense: "기타 증빙 선택",
  etcExpense: "기타",
  evidenceEnum: "증빙 분류",
  classEnum: "품목 분류",
  imageFiles: "사진",
  softwareEvidence: "소프트웨어 증빙",
  softwareEvidenceFiles: "소프트웨어 증빙 파일",
  number: "개수",
  price: "개별 단가",
  enum: "교통수단",
  origin: "출발지",
  destination: "도착지",
  passengers: "탑승 인원",
  traderName: "거래 상대방",
  traderAccountNumber: "거래 상대방 계좌번호",
  wasteExplanation: "폐기 설명",
  explanation: "설명",
  files: "첨부 파일",
};

type Snapshot = Record<string, unknown>;

const empty = "—";
const asRecord = (value: unknown): Snapshot =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Snapshot)
    : {};

const formatValue = (field: string, value: unknown): string => {
  if (field === "purposeActivity" && asRecord(value).id == null) {
    return NO_ACTIVITY_REPORT_FUNDING;
  }
  if (value == null) return empty;
  if (Array.isArray(value)) {
    return value.map(entry => formatValue(field, entry)).join("\n") || empty;
  }
  if (typeof value === "boolean") return value ? "선택" : "미선택";
  if (typeof value === "number") {
    switch (field) {
      case "activityTypeEnumId":
        return getActivityTypeLabel(value as ActivityTypeEnum) ?? String(value);
      case "evidenceEnum":
        return evidenceEnumMap(value as FixtureEvidenceEnum) || String(value);
      case "classEnum":
        return classEnumMap(value as FixtureClassEnum) || String(value);
      case "enum":
        return (
          transportationEnumMap(value as TransportationEnum) || String(value)
        );
      case "price":
      case "expenditureAmount":
        return `${value.toLocaleString("ko-KR")}원`;
      default:
        return String(value);
    }
  }
  if (typeof value === "string") {
    if (["startTerm", "endTerm", "expenditureDate"].includes(field)) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return formatDate(date);
    }
    return value || empty;
  }
  const item = asRecord(value);
  if (item.startTerm && item.endTerm) {
    return `${formatValue("startTerm", item.startTerm)} ~ ${formatValue("endTerm", item.endTerm)}`;
  }
  if (item.studentNumber && item.name) {
    return `${item.studentNumber} ${item.name}`;
  }
  if (typeof item.name === "string") return item.name;
  return String(item.fileId ?? item.studentId ?? item.id ?? empty);
};

interface ReviewChangeRow {
  key: string;
  label: string;
  before: string;
  after: string;
  changed: boolean;
}

const buildRows = (
  before: Snapshot,
  after: Snapshot,
  fieldLabels: Record<string, string>,
  parent?: { key: string; label: string },
): ReviewChangeRow[] => {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const knownKeys = Object.keys(fieldLabels).filter(field =>
    keys.delete(field),
  );
  return [...knownKeys, ...keys].flatMap(field => {
    const oldValue = before[field];
    const newValue = after[field];
    const key = parent ? `${parent.key}.${field}` : field;
    const fieldLabel = fieldLabels[field] ?? field;
    const label = parent ? `${parent.label} · ${fieldLabel}` : fieldLabel;
    const oldFields = asRecord(oldValue);
    const newFields = asRecord(newValue);
    if (
      field !== "purposeActivity" &&
      Object.keys({ ...oldFields, ...newFields }).length > 0
    ) {
      return buildRows(oldFields, newFields, labels, { key, label });
    }
    return [
      {
        key,
        label,
        before: formatValue(field, oldValue),
        after: formatValue(field, newValue),
        changed: JSON.stringify(oldValue) !== JSON.stringify(newValue),
      },
    ];
  });
};

const getReviewChangeRows = (
  kind: "activity" | "funding",
  before: Snapshot,
  after: Snapshot,
) =>
  buildRows(before, after, {
    ...labels,
    name: kind === "activity" ? "활동명" : "지원금 항목명",
    purpose: "활동 목적",
  });

export default getReviewChangeRows;
