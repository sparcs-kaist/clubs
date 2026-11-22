import {
  FixtureClassEnum,
  FixtureEvidenceEnum,
} from "@clubs/interface/common/enum/funding.enum";

import { getFundingPurchaseValidationError } from "./funding-purchase.validator";

const fixture = {
  evidenceEnum: FixtureEvidenceEnum.Purchase,
  classEnum: FixtureClassEnum.Electronics,
  number: 2,
  price: 60_000,
  imageFiles: [],
  softwareEvidenceFiles: [],
};
const purchase = {
  isFixture: true,
  fixture,
  expenditureAmount: 120_000,
};

describe("funding purchase validation", () => {
  it.each([120_000, 125_000])(
    "accepts two 60,000 won items with expenditure %d",
    expenditureAmount => {
      expect(
        getFundingPurchaseValidationError({ ...purchase, expenditureAmount }),
      ).toBeUndefined();
    },
  );

  it("accepts the inclusive 50,000 won unit price boundary", () => {
    expect(
      getFundingPurchaseValidationError({
        ...purchase,
        fixture: { ...fixture, price: 50_000 },
        expenditureAmount: 100_000,
      }),
    ).toBeUndefined();
  });

  it("checks the per-item minimum even when the receipt total exceeds it", () => {
    expect(
      getFundingPurchaseValidationError({
        ...purchase,
        fixture: { ...fixture, price: 49_999 },
      }),
    ).toMatch(/50,000원/);
  });

  it("rejects entering a multi-item total as the price of one item", () => {
    expect(
      getFundingPurchaseValidationError({
        ...purchase,
        fixture: { ...fixture, price: 120_000 },
      }),
    ).toMatch(/지출 금액을 초과/);
  });

  it("keeps supporting evidence separate from the primary fixture purchase", () => {
    expect(
      getFundingPurchaseValidationError({
        ...purchase,
        purposeActivity: { id: null },
        clubSupplies: { ...fixture, price: 120_000 },
      }),
    ).toBeUndefined();
  });

  it.each([
    { evidenceEnum: FixtureEvidenceEnum.Management, price: 1 },
    { classEnum: FixtureClassEnum.Software, price: 1 },
  ])("preserves existing policies for other evidence: %j", changes => {
    expect(
      getFundingPurchaseValidationError({
        ...purchase,
        fixture: { ...fixture, ...changes },
      }),
    ).toBeUndefined();
  });

  it("applies the subtotal check to declared active club supplies without a minimum unit price", () => {
    const supplies = {
      isFixture: false,
      purposeActivity: { id: null },
      clubSupplies: { ...fixture, price: 10_000 },
      expenditureAmount: 20_000,
    };
    expect(getFundingPurchaseValidationError(supplies)).toBeUndefined();
    expect(
      getFundingPurchaseValidationError({
        ...supplies,
        expenditureAmount: 19_999,
      }),
    ).toMatch(/지출 금액을 초과/);
    expect(
      getFundingPurchaseValidationError({
        ...supplies,
        expenditureAmount: 19_999,
        purposeActivity: { id: 1 },
      }),
    ).toBeUndefined();
    expect(
      getFundingPurchaseValidationError({
        ...supplies,
        expenditureAmount: 19_999,
        clubSupplies: { ...supplies.clubSupplies, number: undefined },
      }),
    ).toBeUndefined();
  });

  const legacy = {
    ...purchase,
    fixture: { ...fixture, price: 49_000 },
  };

  it("allows unrelated edits to legacy values outside the new constraints", () => {
    expect(getFundingPurchaseValidationError(legacy, legacy)).toBeUndefined();
  });

  it.each([
    {
      fixture: {
        ...legacy.fixture,
        evidenceEnum: FixtureEvidenceEnum.Management,
      },
    },
    { fixture: { ...legacy.fixture, classEnum: FixtureClassEnum.Furniture } },
    { fixture: { ...legacy.fixture, number: 3 } },
    { fixture: { ...legacy.fixture, price: 48_000 } },
    { expenditureAmount: 100_000 },
  ])("validates a legacy purchase when relevant values change: %j", changes => {
    expect(
      getFundingPurchaseValidationError(legacy, { ...legacy, ...changes }),
    ).toMatch(/50,000원/);
  });
});
