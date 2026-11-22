import {
  FixtureClassEnum,
  FixtureEvidenceEnum,
} from "@clubs/interface/common/enum/funding.enum";

import { formatCurrency } from "@sparcs-clubs/web/utils/format";

import {
  FundingFormData,
  isActivityReportUnverifiable,
} from "../types/funding";

const isTangiblePurchase = (
  evidence: FixtureEvidenceEnum | undefined,
  classification: FixtureClassEnum | undefined,
) =>
  evidence === FixtureEvidenceEnum.Purchase &&
  classification !== undefined &&
  classification !== FixtureClassEnum.Software;

export const getTangiblePurchase = (data: FundingFormData) => {
  if (data.isFixture) {
    if (!isTangiblePurchase(data.fixtureEvidenceEnum, data.fixtureClassEnum)) {
      return undefined;
    }

    return {
      isFixture: true,
      classification: data.fixtureClassEnum,
      quantity: Number(data.numberOfFixture),
      unitPrice: Number(data.priceOfFixture),
    };
  }

  if (
    isActivityReportUnverifiable(data.purposeActivity?.id ?? Infinity) &&
    isTangiblePurchase(
      data.clubSuppliesEvidenceEnum,
      data.clubSuppliesClassEnum,
    )
  ) {
    return {
      isFixture: false,
      classification: data.clubSuppliesClassEnum,
      quantity: Number(data.numberOfClubSupplies),
      unitPrice: Number(data.priceOfClubSupplies),
    };
  }
  return undefined;
};

export const hasSameLegacyPurchase = (
  data: FundingFormData,
  storedFunding: FundingFormData,
) => {
  const current = getTangiblePurchase(data);
  const previous = getTangiblePurchase(storedFunding);
  return (
    current !== undefined &&
    previous !== undefined &&
    current.isFixture === previous.isFixture &&
    current.classification === previous.classification &&
    current.quantity === previous.quantity &&
    current.unitPrice === previous.unitPrice &&
    Number(data.expenditureAmount) === Number(storedFunding.expenditureAmount)
  );
};

export const getFixtureUnitPriceError = (
  itemAmount: number,
  quantity: number,
) => {
  if (
    !Number.isInteger(itemAmount) ||
    itemAmount <= 0 ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return undefined;
  }

  return itemAmount < 50_000 * quantity
    ? "비품 구매는 개당 50,000원 이상이어야 합니다."
    : undefined;
};

export const formatPurchaseReceiptUnitPrice = (
  itemAmount: number,
  quantity: number,
) => {
  if (
    !Number.isSafeInteger(itemAmount) ||
    itemAmount <= 0 ||
    !Number.isSafeInteger(quantity) ||
    quantity <= 0
  ) {
    return undefined;
  }

  const unitPrice = itemAmount / quantity;
  if (Number.isInteger(unitPrice)) return `${formatCurrency(unitPrice)}원`;

  // Truncate so a price just below the fixture threshold never appears as 50,000원.
  const truncatedUnitPrice = Math.floor(unitPrice * 100) / 100;
  return truncatedUnitPrice === 0
    ? "0.01원 미만"
    : `약 ${formatCurrency(truncatedUnitPrice)}원`;
};
