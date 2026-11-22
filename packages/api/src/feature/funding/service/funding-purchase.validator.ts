import { IFunding } from "@clubs/interface/api/funding/type/funding.type";
import {
  FixtureClassEnum,
  FixtureEvidenceEnum,
} from "@clubs/interface/common/enum/funding.enum";

const minimumFixtureUnitPrice = 50_000;

type PurchaseDetails = Pick<
  IFunding,
  | "clubSupplies"
  | "expenditureAmount"
  | "fixture"
  | "isFixture"
  | "purchaseReceipt"
>;

function getTangiblePurchase(request: PurchaseDetails) {
  const item = request.isFixture ? request.fixture : request.clubSupplies;
  const isPurchase = item?.evidenceEnum === FixtureEvidenceEnum.Purchase;
  const isSoftware = item?.classEnum === FixtureClassEnum.Software;
  return isPurchase && !isSoftware ? item : undefined;
}

function hasSameLegacyPurchase(
  request: PurchaseDetails,
  stored: PurchaseDetails,
  current: NonNullable<PurchaseDetails["fixture"]>,
): boolean {
  if (request.isFixture !== stored.isFixture) return false;
  if (request.expenditureAmount !== stored.expenditureAmount) return false;
  const previous = getTangiblePurchase(stored);
  if (!previous) return false;
  const sameClass = current.classEnum === previous.classEnum;
  const sameQuantity = current.number === previous.number;
  const samePrice = current.price === previous.price;
  return sameClass && sameQuantity && samePrice;
}

export function getFundingPurchaseValidationError(
  request: PurchaseDetails,
  evidenceCount: number,
  stored?: PurchaseDetails,
): string | undefined {
  const tangiblePurchase = getTangiblePurchase(request);
  const { purchaseReceipt, expenditureAmount, isFixture } = request;

  if (purchaseReceipt) {
    if (isFixture) {
      if (!tangiblePurchase) {
        return "비품 관리와 소프트웨어는 영수증 품목으로 신청할 수 없습니다.";
      }
      if (
        expenditureAmount <
        minimumFixtureUnitPrice * purchaseReceipt.quantity
      ) {
        return "비품 구매의 개별 단가는 50,000원 이상이어야 합니다.";
      }
    }
    if (evidenceCount === 0) return "거래 증빙 파일을 첨부해 주세요.";
    if (expenditureAmount <= 0) return "품목 지출 금액은 0원보다 커야 합니다.";
    return undefined;
  }

  if (stored?.purchaseReceipt) return "영수증 정보를 삭제할 수 없습니다.";
  if (!tangiblePurchase) return undefined;
  if (stored) {
    if (hasSameLegacyPurchase(request, stored, tangiblePurchase))
      return undefined;
  }
  return isFixture
    ? "비품 구매의 영수증 정보를 입력해 주세요."
    : "동아리 용품 구매의 영수증 정보를 입력해 주세요.";
}
