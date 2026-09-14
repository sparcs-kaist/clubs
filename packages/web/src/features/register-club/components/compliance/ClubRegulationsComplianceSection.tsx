import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import CheckboxOption from "@sparcs-clubs/web/common/components/CheckboxOption";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { CLUBS_COMPLIANCE_LIST } from "@sparcs-clubs/web/features/register-club/constants/registerClub";

interface ClubRegulationsComplianceSectionProps {
  isProvisional?: boolean;
  isAgreed: boolean;
  setIsAgreed: React.Dispatch<React.SetStateAction<boolean>>;
}

const ClubRegulationsComplianceSectionInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  align-self: stretch;

  color: ${({ theme }) => theme.colors.BLACK};
`;

const ClubRegulationsComplianceSection: React.FC<
  ClubRegulationsComplianceSectionProps
> = ({ isProvisional = false, isAgreed, setIsAgreed }) => {
  const t = useTranslations("my.registration");
  return (
    <ClubRegulationsComplianceSectionInner>
      <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20}>
        {t("complianceTitle")}
      </Typography>
      <div>
        {...CLUBS_COMPLIANCE_LIST.map((value, index) => {
          if (isProvisional && index === CLUBS_COMPLIANCE_LIST.length - 1) {
            return null;
          }
          return (
            <Typography
              key={value}
              ff="PRETENDARD"
              fw="REGULAR"
              fs={16}
              lh={28}
            >
              {t(`compliance${index + 1}`)}
            </Typography>
          );
        })}
      </div>
      <CheckboxOption
        optionText={t("compliancePledge")}
        checked={isAgreed}
        onClick={() => setIsAgreed(!isAgreed)}
      />
    </ClubRegulationsComplianceSectionInner>
  );
};

export default ClubRegulationsComplianceSection;
