import {
  FixtureClassEnum,
  FixtureEvidenceEnum,
} from "@clubs/interface/common/enum/funding.enum";

import { getFundingPurchaseValidationError } from "./funding-purchase.validator";

const fixture = {
  name: "비품",
  evidenceEnum: FixtureEvidenceEnum.Purchase,
  classEnum: FixtureClassEnum.Electronics,
  number: 2,
  price: 49_000,
  imageFiles: [],
  softwareEvidenceFiles: [],
};

const legacyPurchase = {
  isFixture: true,
  fixture,
  expenditureAmount: 98_000,
};

const receipt = {
  reference: "receipt-1",
  totalAmount: 200_000,
  itemNumber: 1,
  quantity: 2,
};

describe("funding purchase validation", () => {
  it("requires a receipt for a new tangible fixture purchase", () => {
    expect(getFundingPurchaseValidationError(legacyPurchase, 1)).toMatch(
      /영수증/,
    );
  });

  it.each([
    { isFixture: false },
    { fixture: { ...fixture, evidenceEnum: FixtureEvidenceEnum.Management } },
    { fixture: { ...fixture, classEnum: FixtureClassEnum.Software } },
  ])("keeps non-purchase fixture flows without a receipt: %j", changes => {
    expect(
      getFundingPurchaseValidationError({ ...legacyPurchase, ...changes }, 0),
    ).toBeUndefined();
  });

  it("requires a receipt for a declared physical supplies purchase without imposing a fixture price", () => {
    const request = {
      isFixture: false,
      clubSupplies: fixture,
      expenditureAmount: 20_000,
    };
    expect(getFundingPurchaseValidationError(request, 1)).toMatch(
      /동아리 용품/,
    );
    expect(
      getFundingPurchaseValidationError(
        { ...request, purchaseReceipt: receipt },
        1,
      ),
    ).toBeUndefined();
  });

  it("uses the unrounded per-item amount for the 50,000 won fixture minimum", () => {
    expect(
      getFundingPurchaseValidationError(
        {
          ...legacyPurchase,
          purchaseReceipt: receipt,
          expenditureAmount: 99_999,
        },
        1,
      ),
    ).toMatch(/50,000원/);
    expect(
      getFundingPurchaseValidationError(
        {
          ...legacyPurchase,
          purchaseReceipt: receipt,
          expenditureAmount: 100_000,
        },
        1,
      ),
    ).toBeUndefined();
  });

  it("rejects receipt details on fixture management and software", () => {
    expect(
      getFundingPurchaseValidationError(
        {
          ...legacyPurchase,
          fixture: { ...fixture, evidenceEnum: FixtureEvidenceEnum.Management },
          purchaseReceipt: receipt,
        },
        1,
      ),
    ).toMatch(/관리와 소프트웨어/);
  });

  it("requires a positive item amount and an evidence attachment for receipt-backed requests", () => {
    const request = {
      isFixture: false,
      purchaseReceipt: receipt,
      expenditureAmount: 1,
    };
    expect(getFundingPurchaseValidationError(request, 0)).toMatch(/첨부/);
    expect(
      getFundingPurchaseValidationError(
        { ...request, expenditureAmount: 0 },
        1,
      ),
    ).toMatch(/0원보다/);
  });

  it("preserves an unchanged legacy fixture purchase even below the new minimum", () => {
    expect(
      getFundingPurchaseValidationError(legacyPurchase, 0, legacyPurchase),
    ).toBeUndefined();
  });

  it.each([
    { expenditureAmount: 96_000 },
    { fixture: { ...fixture, number: 3 } },
    { fixture: { ...fixture, price: 48_000 } },
    { fixture: { ...fixture, classEnum: FixtureClassEnum.Furniture } },
    { fixture: { ...fixture, evidenceEnum: FixtureEvidenceEnum.Management } },
    { isFixture: false },
  ])("requires a receipt when a legacy purchase changes: %j", changes => {
    expect(
      getFundingPurchaseValidationError(legacyPurchase, 0, {
        ...legacyPurchase,
        ...changes,
      }),
    ).toMatch(/영수증/);
  });

  it("requires a receipt even when the modified legacy unit price reaches the minimum", () => {
    const updated = {
      ...legacyPurchase,
      fixture: { ...fixture, price: 50_000 },
    };
    expect(
      getFundingPurchaseValidationError(updated, 0, legacyPurchase),
    ).toMatch(/영수증/);
  });

  it("rejects stripping the receipt even when editing to another category", () => {
    expect(
      getFundingPurchaseValidationError(
        { ...legacyPurchase, isFixture: false },
        1,
        { ...legacyPurchase, purchaseReceipt: receipt },
      ),
    ).toMatch(/삭제/);
  });
});
