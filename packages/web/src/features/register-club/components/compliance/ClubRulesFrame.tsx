import { useTranslations } from "next-intl";
import { overlay } from "overlay-kit";
import React from "react";
import styled from "styled-components";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { CLUB_ASSOCIATION_RULES } from "@sparcs-clubs/web/features/register-club/constants/registerClub";

import ClubRegulationsComplianceSection from "./ClubRegulationsComplianceSection";
import RulesButton from "./RulesButton";

interface ClubRulesFrameProps {
  isNewProvisional?: boolean;
  isAgreed: boolean;
  setIsAgreed: React.Dispatch<React.SetStateAction<boolean>>;
}

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ClubRulesFrame: React.FC<ClubRulesFrameProps> = ({
  isNewProvisional = false,
  isAgreed,
  setIsAgreed,
}) => {
  const t = useTranslations("my.registration");
  const openModal = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <FlexWrapper direction="column" gap={12}>
          <Typography
            fs={16}
            lh={28}
            fw="MEDIUM"
            style={{ textAlign: "start", whiteSpace: "pre-line" }}
          >
            {t("divisionRulesContent")}
          </Typography>
          <ButtonWrapper>
            <Button onClick={close}>{t("confirm")}</Button>
          </ButtonWrapper>
        </FlexWrapper>
      </Modal>
    ));
  };

  return (
    <FlexWrapper direction="column" gap={40}>
      <SectionTitle>{t("associationRules")}</SectionTitle>
      <Card outline gap={32} style={{ marginLeft: 24 }}>
        <RulesButton
          title={t("associationRulesTitle")}
          buttonText={t("viewOriginal")}
          onClick={() => window.open(CLUB_ASSOCIATION_RULES)}
        />
        {!isNewProvisional && (
          <RulesButton
            title={t("divisionRules")}
            buttonText={t("viewOriginal")}
            onClick={openModal}
          />
        )}
        <ClubRegulationsComplianceSection
          isProvisional={isNewProvisional}
          isAgreed={isAgreed}
          setIsAgreed={setIsAgreed}
        />
      </Card>
    </FlexWrapper>
  );
};

export default ClubRulesFrame;
