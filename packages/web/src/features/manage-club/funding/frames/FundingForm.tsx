import React, { useEffect, useRef } from "react";
import { FormProvider, useForm } from "react-hook-form";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormError from "@sparcs-clubs/web/common/components/FormError";
import StyledBottom from "@sparcs-clubs/web/common/components/StyledBottom";
import LocalStorageUtil from "@sparcs-clubs/web/common/services/localStorageUtil";
import { LOCAL_STORAGE_KEY } from "@sparcs-clubs/web/constants/localStorage";
import { LocalStorageKeys } from "@sparcs-clubs/web/types/localStorageType";
import { isObjectEmpty, objectDeepCompare } from "@sparcs-clubs/web/utils";

import { NO_ACTIVITY_REPORT_FUNDING } from "../constants";
import { FundingFormData } from "../types/funding";
import {
  getFixtureUnitPriceError,
  getTangiblePurchase,
  hasSameLegacyPurchase,
} from "../utils/purchaseReceipt";
import AddEvidenceFrame from "./AddEvidenceFrame";
import BasicEvidenceFrame from "./BasicEvidenceFrame";
import FundingInfoFrame from "./FundingInfoFrame";
import PurchaseReceiptFrame from "./PurchaseReceiptFrame";

interface FundingFormProps {
  clubId: number;
  initialData?: FundingFormData;
  storedFunding?: FundingFormData;
  draftKey?: LocalStorageKeys;
  onCancel: VoidFunction;
  onSubmit: (data: FundingFormData) => void;
}

const FundingForm: React.FC<FundingFormProps> = ({
  clubId,
  initialData = undefined,
  storedFunding = undefined,
  draftKey = LOCAL_STORAGE_KEY.CREATE_FUNDING,
  onCancel,
  onSubmit,
}) => {
  const defaultValues: FundingFormData = {
    ...initialData,
    purchaseReceiptEnabled:
      initialData?.purchaseReceiptEnabled ??
      Boolean(initialData?.purchaseReceipt),
    purposeActivity: {
      id: initialData?.purposeActivity?.id ?? Infinity,
      name: initialData?.purposeActivity?.name ?? NO_ACTIVITY_REPORT_FUNDING,
    },
  } as FundingFormData;

  const formCtx = useForm<FundingFormData>({
    mode: "all",
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isValid },
    watch,
    clearErrors,
    trigger,
  } = formCtx;

  // 폼 데이터 변경 감지
  const initialRender = useRef(true);
  const previousValues = useRef<FundingFormData>(defaultValues);

  const formData = watch();
  const isEditing = storedFunding !== undefined;
  const receiptBound = Boolean(storedFunding?.purchaseReceipt);
  const tangiblePurchase = getTangiblePurchase(formData);
  const canUsePurchaseReceipt =
    !formData.isFixture || Boolean(tangiblePurchase);
  const receiptRequired =
    receiptBound || (!isEditing && Boolean(tangiblePurchase));
  const usesPurchaseReceipt =
    receiptRequired ||
    (canUsePurchaseReceipt && Boolean(formData.purchaseReceiptEnabled));
  const hasIncompatibleReceipt = receiptBound && !canUsePurchaseReceipt;
  const needsReceiptForEdit = Boolean(
    !usesPurchaseReceipt &&
    tangiblePurchase &&
    storedFunding &&
    !hasSameLegacyPurchase(formData, storedFunding),
  );
  const unitPriceError =
    usesPurchaseReceipt && tangiblePurchase?.isFixture
      ? getFixtureUnitPriceError(
          Number(formData.expenditureAmount),
          Number(formData.purchaseReceipt?.quantity),
        )
      : undefined;
  const canSubmitReceipt =
    !hasIncompatibleReceipt && !needsReceiptForEdit && !unitPriceError;

  const previousReceiptMode = useRef(usesPurchaseReceipt);
  useEffect(() => {
    if (previousReceiptMode.current === usesPurchaseReceipt) return;
    previousReceiptMode.current = usesPurchaseReceipt;

    if (usesPurchaseReceipt) {
      clearErrors([
        "numberOfFixture",
        "priceOfFixture",
        "numberOfClubSupplies",
        "priceOfClubSupplies",
      ]);
    } else {
      clearErrors("purchaseReceipt");
    }
    trigger("expenditureAmount");
  }, [usesPurchaseReceipt, clearErrors, trigger]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    if (
      !isObjectEmpty(formData) &&
      objectDeepCompare(formData, previousValues.current)
    ) {
      LocalStorageUtil.save(draftKey, formData);
      previousValues.current = formData;
    }
  }, [formData, draftKey]);

  return (
    <FormProvider {...formCtx}>
      <form
        onSubmit={handleSubmit(data => {
          if (!canSubmitReceipt) return;
          onSubmit({
            ...data,
            purchaseReceipt: usesPurchaseReceipt
              ? data.purchaseReceipt
              : undefined,
          });
        })}
      >
        <FlexWrapper direction="column" gap={60}>
          <FundingInfoFrame
            clubId={clubId}
            usesPurchaseReceipt={usesPurchaseReceipt}
          />
          {(canUsePurchaseReceipt || receiptBound) && (
            <PurchaseReceiptFrame
              required={receiptRequired}
              needsReceiptForEdit={needsReceiptForEdit}
              unitPriceError={unitPriceError}
            />
          )}
          <BasicEvidenceFrame />
          <AddEvidenceFrame
            usesPurchaseReceipt={usesPurchaseReceipt && !hasIncompatibleReceipt}
          />
          <StyledBottom>
            {hasIncompatibleReceipt && (
              <FormError>
                영수증에 연결된 비품은 소프트웨어 이외의 비품 구매로 작성해
                주세요.
              </FormError>
            )}
            <Button buttonType="button" type="outlined" onClick={onCancel}>
              취소
            </Button>
            <Button
              buttonType="submit"
              type={isValid && canSubmitReceipt ? "default" : "disabled"}
            >
              {isEditing ? "저장" : "신청"}
            </Button>
          </StyledBottom>
        </FlexWrapper>
      </form>
    </FormProvider>
  );
};

export default FundingForm;
