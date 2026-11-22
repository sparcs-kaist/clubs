import React from "react";
import { useFormContext } from "react-hook-form";

import {
  FixtureClassEnum,
  FixtureEvidenceEnum,
} from "@clubs/interface/common/enum/funding.enum";

import Card from "@sparcs-clubs/web/common/components/Card";
import FileUpload from "@sparcs-clubs/web/common/components/FileUpload";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import FormError from "@sparcs-clubs/web/common/components/FormError";
import ItemNumberInput from "@sparcs-clubs/web/common/components/Forms/ItemNumberInput";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import UnitInput from "@sparcs-clubs/web/common/components/Forms/UnitInput";
import Select from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { formatCurrency } from "@sparcs-clubs/web/utils/format";

import { FundingFormData } from "../types/funding";
import EvidenceBlockTitle from "./EvidenceBlockTitle";

interface FixtureEvidenceBlockProps {
  isFixture: boolean;
  required?: boolean;
}

const FixtureEvidenceBlock: React.FC<FixtureEvidenceBlockProps> = ({
  isFixture,
  required = false,
}) => {
  const formCtx = useFormContext<FundingFormData>();
  const { control, watch, setValue } = formCtx;

  const fixtureClassEnum = watch("fixtureClassEnum");
  const clubSuppliesClassEnum = watch("clubSuppliesClassEnum");
  const fixtureFiles = watch("fixtureSoftwareEvidenceFiles");
  const clubSuppliesFiles = watch("clubSuppliesSoftwareEvidenceFiles");
  const selectedClass = isFixture ? fixtureClassEnum : clubSuppliesClassEnum;
  const evidence = watch(
    isFixture ? "fixtureEvidenceEnum" : "clubSuppliesEvidenceEnum",
  );
  const quantity = Number(
    watch(isFixture ? "numberOfFixture" : "numberOfClubSupplies"),
  );
  const price = Number(
    watch(isFixture ? "priceOfFixture" : "priceOfClubSupplies"),
  );
  const expenditureAmount = Number(watch("expenditureAmount"));
  const isFixtureRow = watch("isFixture");
  const isPurchase = evidence === FixtureEvidenceEnum.Purchase;
  const isPhysicalPurchase =
    isPurchase &&
    selectedClass != null &&
    selectedClass !== FixtureClassEnum.Software;
  const isTangibleFixture = isPhysicalPurchase && isFixture;
  const isTangibleClubSupplies = isPhysicalPurchase && !isFixtureRow;
  const hasPrice = Number.isSafeInteger(price) && price > 0;
  const subtotal = quantity * price;
  const hasSubtotal =
    hasPrice &&
    Number.isSafeInteger(quantity) &&
    quantity > 0 &&
    Number.isSafeInteger(subtotal);
  const exceedsExpenditure =
    (isTangibleFixture || isTangibleClubSupplies) &&
    hasSubtotal &&
    Number.isSafeInteger(expenditureAmount) &&
    subtotal > expenditureAmount;

  const content = isFixture ? "비품" : "동아리 용품";

  const fixtureEvidenceList = [
    { label: `${content} 구매`, value: FixtureEvidenceEnum.Purchase },
    { label: `${content} 관리`, value: FixtureEvidenceEnum.Management },
  ];

  const fixtureClassList = [
    { label: "전자기기", value: FixtureClassEnum.Electronics },
    { label: "가구", value: FixtureClassEnum.Furniture },
    { label: "악기", value: FixtureClassEnum.MusicalInstruments },
    { label: "소프트웨어", value: FixtureClassEnum.Software },
    { label: "기타", value: FixtureClassEnum.Others },
  ];

  return (
    <FlexWrapper direction="column" gap={8}>
      <EvidenceBlockTitle title={`${content} 증빙`}>
        <Card outline gap={32}>
          <FlexWrapper direction="row" gap={32}>
            <FormController
              name={
                isFixture ? "fixtureEvidenceEnum" : "clubSuppliesEvidenceEnum"
              }
              required={required}
              control={control}
              renderItem={props => (
                <Select
                  {...props}
                  items={fixtureEvidenceList}
                  label="증빙 분류"
                  placeholder="증빙 분류를 선택해주세요"
                />
              )}
            />
            <FormController
              name={isFixture ? "fixtureClassEnum" : "clubSuppliesClassEnum"}
              required={required}
              control={control}
              renderItem={props => (
                <Select
                  {...props}
                  items={fixtureClassList}
                  label={`${content} 분류`}
                  placeholder={`${content} 분류를 선택해주세요`}
                />
              )}
            />
          </FlexWrapper>
          <FormController
            name={isFixture ? "fixtureName" : "clubSuppliesName"}
            required={required}
            control={control}
            renderItem={props => (
              <TextInput
                {...props}
                placeholder={`${content}명을 입력해주세요`}
                label={`${content}명`}
              />
            )}
          />

          <FlexWrapper direction="row" gap={32}>
            <FormController
              name={isFixture ? "numberOfFixture" : "numberOfClubSupplies"}
              required={required}
              control={control}
              renderItem={props => (
                <ItemNumberInput
                  {...props}
                  label={`${content} 개수`}
                  placeholder={`${content} 개수를 입력해주세요`}
                />
              )}
            />
            <FormController
              name={isFixture ? "priceOfFixture" : "priceOfClubSupplies"}
              required={required}
              control={control}
              renderItem={({ value, onChange }) => (
                <UnitInput
                  label={`${content} 개별 단가`}
                  placeholder={`${content} 개별 단가를 입력해주세요`}
                  unit="원 / 1개"
                  value={value?.toString()}
                  handleChange={onChange}
                  setErrorStatus={() => {}}
                />
              )}
            />
          </FlexWrapper>
          {isPurchase && (
            <FlexWrapper direction="column" gap={4}>
              <Typography fs={14} lh={20}>
                개별 단가에는 배송비를 포함하지 마세요.
              </Typography>
              {hasSubtotal && (
                <Typography fs={14} lh={20}>
                  품목 소계 {formatCurrency(subtotal)}원 ({quantity}개 ×{" "}
                  {formatCurrency(price)}원)
                </Typography>
              )}
              {isTangibleFixture &&
                (hasPrice && price < 50_000 ? (
                  <FormError>
                    비품 구매는 개당 50,000원 이상이어야 합니다.
                  </FormError>
                ) : (
                  <Typography fs={14} lh={20}>
                    비품 구매는 개당 50,000원 이상인 물품을 신청해 주세요.
                  </Typography>
                ))}
              {exceedsExpenditure && (
                <FormError>품목 소계가 지출 금액보다 큽니다.</FormError>
              )}
            </FlexWrapper>
          )}
          {/* TODO: EvidenceUploadWithText 컴포넌트로 변경 */}
          {(isFixture ? fixtureClassEnum : clubSuppliesClassEnum) && (
            <FlexWrapper direction="column" gap={4}>
              <Typography
                ff="PRETENDARD"
                fw="MEDIUM"
                fs={16}
                lh={20}
                color="BLACK"
              >
                {(isFixture ? fixtureClassEnum : clubSuppliesClassEnum) ===
                FixtureClassEnum.Software
                  ? "소프트웨어 증빙"
                  : `${content} 증빙`}
              </Typography>
              <Typography
                ff="PRETENDARD"
                fw="REGULAR"
                fs={14}
                lh={20}
                color="GRAY.600"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {(isFixture ? fixtureClassEnum : clubSuppliesClassEnum) ===
                FixtureClassEnum.Software
                  ? "* 동아리 성격에 합치하는 활동에 사용하는 소프트웨어라는 소명 필요"
                  : `* ${content} 사용 목적 입력 필요`}
              </Typography>
              {isFixture ? (
                <FormController
                  name={
                    fixtureClassEnum === FixtureClassEnum.Software
                      ? "fixtureSoftwareEvidence"
                      : "fixturePurpose"
                  }
                  required={required}
                  control={control}
                  renderItem={props => (
                    <TextInput
                      {...props}
                      placeholder={
                        fixtureClassEnum === FixtureClassEnum.Software
                          ? "소프트웨어 증빙을 입력하세요"
                          : `${content} 증빙을 입력하세요`
                      }
                      area
                    />
                  )}
                />
              ) : (
                <FormController
                  name={
                    clubSuppliesClassEnum === FixtureClassEnum.Software
                      ? "clubSuppliesSoftwareEvidence"
                      : "clubSuppliesPurpose"
                  }
                  required={required}
                  control={control}
                  renderItem={props => (
                    <TextInput
                      {...props}
                      placeholder={
                        clubSuppliesClassEnum === FixtureClassEnum.Software
                          ? "소프트웨어 증빙을 입력하세요"
                          : `${content} 증빙을 입력하세요`
                      }
                      area
                    />
                  )}
                />
              )}

              {isFixture ? (
                <FormController
                  name={
                    fixtureClassEnum === FixtureClassEnum.Software
                      ? "fixtureSoftwareEvidenceFiles"
                      : "fixtureImageFiles"
                  }
                  required={required}
                  control={control}
                  renderItem={props => (
                    <FileUpload
                      {...props}
                      fileId="fixtureFiles"
                      multiple
                      initialFiles={fixtureFiles}
                      onChange={files =>
                        setValue(
                          fixtureClassEnum === FixtureClassEnum.Software
                            ? "fixtureSoftwareEvidenceFiles"
                            : "fixtureImageFiles",
                          files,
                          {
                            shouldValidate: true,
                          },
                        )
                      }
                    />
                  )}
                />
              ) : (
                <FormController
                  name={
                    clubSuppliesClassEnum === FixtureClassEnum.Software
                      ? "clubSuppliesSoftwareEvidenceFiles"
                      : "clubSuppliesImageFiles"
                  }
                  required={required}
                  control={control}
                  renderItem={props => (
                    <FileUpload
                      {...props}
                      fileId="clubSuppliesFiles"
                      multiple
                      initialFiles={clubSuppliesFiles}
                      onChange={files =>
                        setValue(
                          clubSuppliesClassEnum === FixtureClassEnum.Software
                            ? "clubSuppliesSoftwareEvidenceFiles"
                            : "clubSuppliesImageFiles",
                          files,
                          {
                            shouldValidate: true,
                          },
                        )
                      }
                    />
                  )}
                />
              )}
            </FlexWrapper>
          )}
        </Card>
      </EvidenceBlockTitle>
    </FlexWrapper>
  );
};

export default FixtureEvidenceBlock;
