import React, { useState } from "react";

import Card from "@sparcs-clubs/web/common/components/Card";
import CheckboxOption from "@sparcs-clubs/web/common/components/CheckboxOption";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import Typography from "@sparcs-clubs/web/common/components/Typography";

import FixtureEvidenceBlock from "../components/FixtureEvidenceBlock";
import NonCorpEvidenceBlock from "../components/NonCorpEvidenceBlock";
import OtherEvidenceBlock from "../components/OtherEvidenceBlock";
import TransportEvidenceBlock from "../components/TransportEvidenceBlock";

import { FundingFrameProps } from "./FundingInfoFrame";

const AddEvidenceFrame: React.FC<FundingFrameProps> = ({
  funding,
  setFunding,
}) => {
  const [toggle, setToggle] = useState(true);

  return (
    <FoldableSectionTitle
      title="추가 증빙"
      toggle={toggle}
      toggleHandler={() => setToggle(!toggle)}
    >
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
              <CheckboxOption
                optionText="(활동보고서로 증빙이 불가능한) 동아리 용품"
                checked={funding.purposeId === "0"}
                onClick={() => {}}
              />
              <CheckboxOption
                optionText="비품"
                checked={funding.isFixture}
                onClick={() =>
                  setFunding({
                    ...funding,
                    isFixture: !funding.isFixture,
                  })
                }
              />
              <CheckboxOption
                optionText="교통비"
                checked={funding.isTransportation}
                onClick={() =>
                  setFunding({
                    ...funding,
                    isTransportation: !funding.isTransportation,
                  })
                }
              />
              <CheckboxOption
                optionText="비법인 거래"
                checked={funding.isNonCorporateTransaction}
                onClick={() =>
                  setFunding({
                    ...funding,
                    isNonCorporateTransaction:
                      !funding.isNonCorporateTransaction,
                  })
                }
              />
              <CheckboxOption
                optionText="식비"
                checked={funding.isFoodExpense}
                onClick={() =>
                  setFunding({
                    ...funding,
                    isFoodExpense: !funding.isFoodExpense,
                  })
                }
              />
              <CheckboxOption
                optionText="근로 계약"
                checked={funding.isLaborContract}
                onClick={() =>
                  setFunding({
                    ...funding,
                    isLaborContract: !funding.isLaborContract,
                  })
                }
              />
              <CheckboxOption
                optionText="외부 행사 참가비"
                checked={funding.isExternalEventParticipationFee}
                onClick={() =>
                  setFunding({
                    ...funding,
                    isExternalEventParticipationFee:
                      !funding.isExternalEventParticipationFee,
                  })
                }
              />
              <CheckboxOption
                optionText="발간물"
                checked={funding.isPublication}
                onClick={() =>
                  setFunding({
                    ...funding,
                    isPublication: !funding.isPublication,
                  })
                }
              />
              <CheckboxOption
                optionText="수익 사업"
                checked={funding.isProfitMakingActivity}
                onClick={() =>
                  setFunding({
                    ...funding,
                    isProfitMakingActivity: !funding.isProfitMakingActivity,
                  })
                }
              />
              <CheckboxOption
                optionText="공동 경비"
                checked={funding.isJointExpense}
                onClick={() =>
                  setFunding({
                    ...funding,
                    isJointExpense: !funding.isJointExpense,
                  })
                }
              />
              <CheckboxOption
                optionText="기타"
                checked={funding.isEtcExpense}
                onClick={() =>
                  setFunding({
                    ...funding,
                    isEtcExpense: !funding.isEtcExpense,
                  })
                }
              />
            </FlexWrapper>
          </FlexWrapper>
        </Card>
        {/* 활보로 증빙 불가능한 동아리 용품 */}
        {funding.purposeId === "0" && (
          <FixtureEvidenceBlock
            isFixture={false}
            funding={funding}
            setFunding={setFunding}
          />
        )}
        {funding.isFixture && (
          <FixtureEvidenceBlock
            isFixture
            funding={funding}
            setFunding={setFunding}
          />
        )}
        {funding.isTransportation && (
          <TransportEvidenceBlock funding={funding} setFunding={setFunding} />
        )}
        {funding.isNonCorporateTransaction && (
          <NonCorpEvidenceBlock funding={funding} setFunding={setFunding} />
        )}
        {funding.isFoodExpense && (
          <OtherEvidenceBlock
            content="식비"
            value={funding.foodExpenseExplanation}
            onChange={value =>
              setFunding({
                ...funding,
                foodExpenseExplanation: value,
              })
            }
          />
        )}
        {funding.isLaborContract && (
          <OtherEvidenceBlock
            content="근로 계약"
            value={funding.laborContractExplanation}
            onChange={value =>
              setFunding({
                ...funding,
                laborContractExplanation: value,
              })
            }
          />
        )}
        {funding.isExternalEventParticipationFee && (
          <OtherEvidenceBlock
            content="외부 행사 참가비"
            value={funding.externalEventParticipationFeeExplanation}
            onChange={value =>
              setFunding({
                ...funding,
                externalEventParticipationFeeExplanation: value,
              })
            }
          />
        )}
        {funding.isPublication && (
          <OtherEvidenceBlock
            content="발간물"
            value={funding.publicationExplanation}
            onChange={value =>
              setFunding({
                ...funding,
                publicationExplanation: value,
              })
            }
          />
        )}
        {funding.isProfitMakingActivity && (
          <OtherEvidenceBlock
            content="수익 사업"
            value={funding.profitMakingActivityExplanation}
            onChange={value =>
              setFunding({
                ...funding,
                profitMakingActivityExplanation: value,
              })
            }
          />
        )}
        {funding.isJointExpense && (
          <OtherEvidenceBlock
            content="공동 경비"
            value={funding.jointExpenseExplanation}
            onChange={value =>
              setFunding({
                ...funding,
                jointExpenseExplanation: value,
              })
            }
          />
        )}
        {funding.isEtcExpense && (
          <OtherEvidenceBlock
            content="기타"
            value={funding.etcExpenseExplanation}
            onChange={value =>
              setFunding({
                ...funding,
                etcExpenseExplanation: value,
              })
            }
          />
        )}
      </FlexWrapper>
    </FoldableSectionTitle>
  );
};
export default AddEvidenceFrame;
