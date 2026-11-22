import {
  IFixture,
  IFunding,
} from "@clubs/interface/api/funding/type/funding.type";
import {
  FixtureClassEnum,
  FixtureEvidenceEnum,
} from "@clubs/interface/common/enum/funding.enum";

type FundingPurchase = Pick<
  IFunding,
  | "clubSupplies"
  | "expenditureAmount"
  | "fixture"
  | "isFixture"
  | "purposeActivity"
>;

function isSamePurchase(item: IFixture, previous: IFixture): boolean {
  const sameClass = item.classEnum === previous.classEnum;
  const sameEvidence = item.evidenceEnum === previous.evidenceEnum;
  const sameQuantity = (item.number ?? null) === (previous.number ?? null);
  const samePrice = (item.price ?? null) === (previous.price ?? null);
  return sameClass && sameEvidence && sameQuantity && samePrice;
}

function getEvidence(funding: FundingPurchase): IFixture | undefined {
  if (funding.isFixture) return funding.fixture;
  return funding.purposeActivity?.id == null ? funding.clubSupplies : undefined;
}

export function getFundingPurchaseValidationError(
  request: FundingPurchase,
  stored?: FundingPurchase,
): string | undefined {
  const { isFixture, expenditureAmount } = request;
  const item = getEvidence(request);
  const isPurchase = item?.evidenceEnum === FixtureEvidenceEnum.Purchase;
  const isSoftware = item?.classEnum === FixtureClassEnum.Software;
  if (!isPurchase || isSoftware) return undefined;

  const previous =
    stored?.isFixture === isFixture ? getEvidence(stored) : undefined;
  const sameExpenditure = expenditureAmount === stored?.expenditureAmount;
  const samePurchase = previous ? isSamePurchase(item, previous) : false;
  if (sameExpenditure && samePurchase) return undefined;

  const { number, price } = item;
  const belowMinimum = (price ?? 0) < 50_000;
  if (isFixture && belowMinimum) {
    return "비품 구매의 개별 단가는 50,000원 이상이어야 합니다.";
  }

  if (number == null) return undefined;
  if (price == null) return undefined;
  if (number * price > expenditureAmount) {
    return "개수와 개별 단가를 곱한 금액은 지출 금액을 초과할 수 없습니다.";
  }
  return undefined;
}
