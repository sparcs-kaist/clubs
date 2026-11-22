import React, { useId } from "react";
import { useFormContext } from "react-hook-form";

import Card from "@sparcs-clubs/web/common/components/Card";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import FormError from "@sparcs-clubs/web/common/components/FormError";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import { FundingFormData } from "../types/funding";
import { formatPurchaseReceiptUnitPrice } from "../utils/purchaseReceipt";

const amountFields = [
  { name: "purchaseReceipt.totalAmount", label: "영수증 전체 결제 금액(원)" },
  { name: "purchaseReceipt.itemNumber", label: "영수증 내 품목 줄 번호" },
  { name: "purchaseReceipt.quantity", label: "이 품목의 개수" },
] as const;

const PurchaseReceiptFrame: React.FC<{
  required: boolean;
  needsReceiptForEdit: boolean;
  unitPriceError?: string;
}> = ({ required, needsReceiptForEdit, unitPriceError = undefined }) => {
  const { control, watch } = useFormContext<FundingFormData>();
  const receiptOptionId = useId();
  const enabled = required || watch("purchaseReceiptEnabled");
  const itemAmount = Number(watch("expenditureAmount"));
  const quantity = Number(watch("purchaseReceipt.quantity"));
  const formattedUnitPrice = formatPurchaseReceiptUnitPrice(
    itemAmount,
    quantity,
  );

  return (
    <FoldableSectionTitle title="영수증 정보">
      <Card outline gap={16}>
        {!required && (
          <FormController
            name="purchaseReceiptEnabled"
            control={control}
            renderItem={({ value, onChange }) => (
              <label htmlFor={receiptOptionId}>
                <input
                  id={receiptOptionId}
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={event => onChange(event.target.checked)}
                />{" "}
                영수증 품목별로 신청
              </label>
            )}
          />
        )}
        {needsReceiptForEdit && (
          <FormError>
            구매 품목의 정보나 금액을 수정하려면 영수증 품목별로 신청을 선택하고
            영수증 정보를 입력해 주세요.
          </FormError>
        )}
        {enabled && (
          <>
            <Typography fs={14} lh={20}>
              한 신청서에 영수증의 품목 한 줄만 입력해 주세요. 같은 영수증의
              다른 품목은 별도로 신청하고 거래처와 영수증 번호, 지출 일자,
              영수증 전체 결제 금액을 동일하게 입력해 주세요.
            </Typography>
            <FormController
              name="purchaseReceipt.reference"
              control={control}
              required
              maxLength={128}
              rules={{
                validate: value =>
                  Boolean(value?.trim()) ||
                  "거래처와 영수증 번호를 입력해 주세요.",
              }}
              renderItem={props => (
                <TextInput
                  {...props}
                  aria-label="거래처와 영수증 번호"
                  label="거래처와 영수증 번호"
                  placeholder="거래처 이름과 결제 식별 번호를 입력해 주세요"
                  helperText="영수증 번호, 주문번호 또는 승인번호를 사용해 주세요. 카드번호와 계좌번호는 입력하지 마세요."
                />
              )}
            />
            {amountFields.map(({ name, label }) => (
              <FormController
                key={name}
                name={name}
                control={control}
                required
                rules={{
                  validate: value =>
                    (Number.isInteger(value) &&
                      value > 0 &&
                      value <= 2_147_483_647) ||
                    "1 이상 2,147,483,647 이하의 정수를 입력해 주세요.",
                }}
                renderItem={({ value, onChange, errorMessage }) => (
                  <TextInput
                    aria-label={label}
                    label={label}
                    placeholder={`${label}을 입력해 주세요`}
                    inputMode="numeric"
                    value={value?.toString() ?? ""}
                    errorMessage={errorMessage}
                    handleChange={input => {
                      if (/^\d*$/.test(input)) {
                        onChange(input === "" ? null : Number(input));
                      }
                    }}
                  />
                )}
              />
            ))}
            <TextInput
              aria-label="개당 가격"
              label="개당 가격"
              placeholder="이 품목의 결제 금액과 개수를 입력해 주세요"
              value={formattedUnitPrice ?? ""}
              errorMessage={unitPriceError}
              readOnly
            />
          </>
        )}
      </Card>
    </FoldableSectionTitle>
  );
};

export default PurchaseReceiptFrame;
