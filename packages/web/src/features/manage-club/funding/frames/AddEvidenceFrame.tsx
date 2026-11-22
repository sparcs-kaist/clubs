import React, { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";

import Card from "@sparcs-clubs/web/common/components/Card";
import CheckboxOption from "@sparcs-clubs/web/common/components/CheckboxOption";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import FixtureEvidenceBlock from "../components/FixtureEvidenceBlock";
import NonCorpEvidenceBlock from "../components/NonCorpEvidenceBlock";
import OtherEvidenceBlock from "../components/OtherEvidenceBlock";
import TransportEvidenceBlock from "../components/TransportEvidenceBlock";
import {
  FundingFormData,
  isActivityReportUnverifiable,
} from "../types/funding";

const AddEvidenceFrame: React.FC = () => {
  const formCtx = useFormContext<FundingFormData>();
  const { control, watch, setValue } = formCtx;

  const purposeId = watch("purposeActivity.id");
  const isFixture = watch("isFixture");
  const isTransportation = watch("isTransportation");
  const isNonCorporateTransaction = watch("isNonCorporateTransaction");
  const isFoodExpense = watch("isFoodExpense");
  const isLaborContract = watch("isLaborContract");
  const isPublication = watch("isPublication");
  const isExternalEventParticipationFee = watch(
    "isExternalEventParticipationFee",
  );
  const isProfitMakingActivity = watch("isProfitMakingActivity");
  const isJointExpense = watch("isJointExpense");
  const isEtcExpense = watch("isEtcExpense");

  const isNoActivityPurpose = useMemo(
    () => isActivityReportUnverifiable(purposeId),
    [purposeId],
  );

  useEffect(() => {
    if (isNoActivityPurpose) {
      setValue("isTransportation", false);
      setValue("isFoodExpense", false);
      setValue("isLaborContract", false);
      setValue("isExternalEventParticipationFee", false);
      setValue("isPublication", false);
      setValue("isProfitMakingActivity", false);
      setValue("isJointExpense", false);
    }
  }, [isNoActivityPurpose]);

  return (
    <FoldableSectionTitle title="추가 증빙">
      <FlexWrapper direction="column" gap={40}>
        <Card outline>
          <FlexWrapper direction="column" gap={16}>
            <Typography
              ff="PRETENDARD"
              fw="MEDIUM"
              fs={16}
              lh={20}
              color="BLACK"
            >
              추가 증빙 분류
            </Typography>
            <FlexWrapper direction="column" gap={12}>
              {isNoActivityPurpose ? (
                <>
                  <CheckboxOption
                    optionText="(활동보고서로 증빙이 불가능한) 동아리 용품"
                    checked={isNoActivityPurpose}
                    onClick={() => {}}
                  />
                  <FormController
                    name="isFixture"
                    control={control}
                    renderItem={({ value, onChange }) => (
                      <CheckboxOption
                        optionText="비품"
                        checked={isFixture}
                        onClick={() => onChange(!value)}
                      />
                    )}
                  />
                  <FormController
                    name="isNonCorporateTransaction"
                    control={control}
                    renderItem={({ value, onChange }) => (
                      <CheckboxOption
                        optionText="비법인 거래"
                        checked={isNonCorporateTransaction}
                        onClick={() => onChange(!value)}
                      />
                    )}
                  />
                  <FormController
                    name="isEtcExpense"
                    control={control}
                    renderItem={({ value, onChange }) => (
                      <CheckboxOption
                        optionText="기타"
                        checked={isEtcExpense}
                        onClick={() => onChange(!value)}
                      />
                    )}
                  />
                </>
              ) : (
                <>
                  <FormController
                    name="isFixture"
                    control={control}
                    renderItem={({ value, onChange }) => (
                      <CheckboxOption
                        optionText="비품"
                        checked={value}
                        onClick={() => onChange(!value)}
                      />
                    )}
                  />
                  <FormController
                    name="isTransportation"
                    control={control}
                    renderItem={({ value, onChange }) => (
                      <CheckboxOption
                        optionText="교통비"
                        checked={value}
                        onClick={() => onChange(!value)}
                      />
                    )}
                  />
                  <FormController
                    name="isNonCorporateTransaction"
                    control={control}
                    renderItem={({ value, onChange }) => (
                      <CheckboxOption
                        optionText="비법인 거래"
                        checked={value}
                        onClick={() => onChange(!value)}
                      />
                    )}
                  />
                  <FormController
                    name="isFoodExpense"
                    control={control}
                    renderItem={({ value, onChange }) => (
                      <CheckboxOption
                        optionText="식비"
                        checked={value}
                        onClick={() => onChange(!value)}
                      />
                    )}
                  />
                  <FormController
                    name="isLaborContract"
                    control={control}
                    renderItem={({ value, onChange }) => (
                      <CheckboxOption
                        optionText="근로 계약"
                        checked={value}
                        onClick={() => onChange(!value)}
                      />
                    )}
                  />
                  <FormController
                    name="isExternalEventParticipationFee"
                    control={control}
                    renderItem={({ value, onChange }) => (
                      <CheckboxOption
                        optionText="외부 행사 참가비"
                        checked={value}
                        onClick={() => onChange(!value)}
                      />
                    )}
                  />
                  <FormController
                    name="isPublication"
                    control={control}
                    renderItem={({ value, onChange }) => (
                      <CheckboxOption
                        optionText="발간물"
                        checked={value}
                        onClick={() => onChange(!value)}
                      />
                    )}
                  />
                  <FormController
                    name="isProfitMakingActivity"
                    control={control}
                    renderItem={({ value, onChange }) => (
                      <CheckboxOption
                        optionText="수익 사업"
                        checked={value}
                        onClick={() => onChange(!value)}
                      />
                    )}
                  />
                  <FormController
                    name="isJointExpense"
                    control={control}
                    renderItem={({ value, onChange }) => (
                      <CheckboxOption
                        optionText="공동 경비"
                        checked={value}
                        onClick={() => onChange(!value)}
                      />
                    )}
                  />
                  <FormController
                    name="isEtcExpense"
                    control={control}
                    renderItem={({ value, onChange }) => (
                      <CheckboxOption
                        optionText="기타"
                        checked={value}
                        onClick={() => onChange(!value)}
                      />
                    )}
                  />
                </>
              )}
            </FlexWrapper>
          </FlexWrapper>
        </Card>
        {/* 활보로 증빙 불가능한 동아리 용품 */}
        {isNoActivityPurpose && (
          <FixtureEvidenceBlock isFixture={false} required />
        )}
        {isFixture && <FixtureEvidenceBlock isFixture required={isFixture} />}
        {isTransportation && (
          <TransportEvidenceBlock
            required={isTransportation}
            activityId={purposeId}
          />
        )}
        {isNonCorporateTransaction && (
          <NonCorpEvidenceBlock required={isNonCorporateTransaction} />
        )}
        {isFoodExpense && (
          <OtherEvidenceBlock
            content="식비"
            explanationControlName="foodExpenseExplanation"
            fileControlName="foodExpenseFiles"
            required={isFoodExpense}
            fileOnChange={files =>
              setValue("foodExpenseFiles", files, {
                shouldValidate: true,
              })
            }
            initialFiles={watch("foodExpenseFiles")}
          />
        )}
        {isLaborContract && (
          <OtherEvidenceBlock
            content="근로 계약"
            explanationControlName="laborContractExplanation"
            fileControlName="laborContractFiles"
            required={isLaborContract}
            fileOnChange={files =>
              setValue("laborContractFiles", files, {
                shouldValidate: true,
              })
            }
            initialFiles={watch("laborContractFiles")}
          />
        )}
        {isExternalEventParticipationFee && (
          <OtherEvidenceBlock
            content="외부 행사 참가비"
            explanationControlName="externalEventParticipationFeeExplanation"
            fileControlName="externalEventParticipationFeeFiles"
            required={isExternalEventParticipationFee}
            fileOnChange={files =>
              setValue("externalEventParticipationFeeFiles", files, {
                shouldValidate: true,
              })
            }
            initialFiles={watch("externalEventParticipationFeeFiles")}
          />
        )}
        {isPublication && (
          <OtherEvidenceBlock
            content="발간물"
            explanationControlName="publicationExplanation"
            fileControlName="publicationFiles"
            required={isPublication}
            fileOnChange={files =>
              setValue("publicationFiles", files, {
                shouldValidate: true,
              })
            }
            initialFiles={watch("publicationFiles")}
          />
        )}
        {isProfitMakingActivity && (
          <OtherEvidenceBlock
            content="수익 사업"
            explanationControlName="profitMakingActivityExplanation"
            fileControlName="profitMakingActivityFiles"
            required={isProfitMakingActivity}
            fileOnChange={files =>
              setValue("profitMakingActivityFiles", files, {
                shouldValidate: true,
              })
            }
            initialFiles={watch("profitMakingActivityFiles")}
          />
        )}
        {isJointExpense && (
          <OtherEvidenceBlock
            content="공동 경비"
            explanationControlName="jointExpenseExplanation"
            fileControlName="jointExpenseFiles"
            required={isJointExpense}
            fileOnChange={files =>
              setValue("jointExpenseFiles", files, {
                shouldValidate: true,
              })
            }
            initialFiles={watch("jointExpenseFiles")}
          />
        )}
        {isEtcExpense && (
          <OtherEvidenceBlock
            content="기타"
            explanationControlName="etcExpenseExplanation"
            fileControlName="etcExpenseFiles"
            required={isEtcExpense}
            fileOnChange={files =>
              setValue("etcExpenseFiles", files, {
                shouldValidate: true,
              })
            }
            initialFiles={watch("etcExpenseFiles")}
          />
        )}
      </FlexWrapper>
    </FoldableSectionTitle>
  );
};
export default AddEvidenceFrame;
