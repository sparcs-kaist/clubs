import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import styled, { useTheme } from "styled-components";

import Button from "@sparcs-clubs/web/common/components/Button";
import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import Card from "@sparcs-clubs/web/common/components/Card";
import CheckboxOption from "@sparcs-clubs/web/common/components/CheckboxOption";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import Toggle from "@sparcs-clubs/web/common/components/Toggle";
import Typography from "@sparcs-clubs/web/common/components/Typography";

export interface AgreementModalProps {
  isOpen: boolean;
  onAgree: () => void;
  onDisagree: () => void;
}

const StyledModalContainer = styled.div`
  width: 536px;
  display: flex;
  flex-direction: column;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    width: 216px;
  }
  gap: 16px;
`;

const TextButtonContainer = styled.div`
  width: 536px;
  display: flex;
  flex-direction: column;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    width: 216px;
  }
  align-items: center;
  gap: 16px;
`;

const ResponsiveTypography = styled(Typography)`
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    font-size: 14px;
    line-height: 20px;
  }
`;

const StyledOl = styled.ol`
  margin: 0px;
  margin-top: 8px;
  padding-left: 16px;
`;
const AgreementModal: React.FC<AgreementModalProps> = ({
  isOpen,
  onAgree,
  onDisagree,
}) => {
  const theme = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${theme.responsive.BREAKPOINT.sm})`,
    );

    // Check the initial state
    setIsMobile(mediaQuery.matches);

    // Set up an event listener to update the state when the window resizes
    const handleResize = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleResize);

    // Clean up the event listener on component unmount
    return () => mediaQuery.removeEventListener("change", handleResize);
  }, [theme]);

  const [isChecked, setIsChecked] = useState(false);
  const t = useTranslations("agree");

  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <StyledModalContainer>
        <ResponsiveTypography>{t("notice")}</ResponsiveTypography>
        <Card gap={16} padding="16px" outline>
          <Toggle
            label={
              <Typography fs={isMobile ? 14 : 16}>
                {t("개인정보 동의")}
              </Typography>
            }
          >
            <Typography fs={isMobile ? 14 : 16} lh={isMobile ? 24 : 28}>
              {t("개인정보 동의 내용.main")}
              <StyledOl>
                <li>{t("개인정보 동의 내용.sub-1")}</li>
                <li>{t("개인정보 동의 내용.sub-2")}</li>
                <li>{t("개인정보 동의 내용.sub-3")}</li>
                <li>{t("개인정보 동의 내용.sub-4")}</li>
              </StyledOl>
            </Typography>
          </Toggle>
        </Card>
        <Card gap={16} padding="16px" outline>
          <Toggle
            label={
              <Typography fs={isMobile ? 14 : 16}>{t("제3자 동의")}</Typography>
            }
          >
            <Typography fs={isMobile ? 14 : 16} lh={isMobile ? 24 : 28}>
              {t("제3자 동의 내용.main")}
              <StyledOl>
                <li>{t("제3자 동의 내용.sub-1")}</li>
                <li>{t("제3자 동의 내용.sub-2")}</li>
                <li>{t("제3자 동의 내용.sub-3")}</li>
                <li>{t("제3자 동의 내용.sub-4")}</li>
                <li>{t("제3자 동의 내용.sub-5")}</li>
              </StyledOl>
              <StyledOl>
                <li>{t("studentCouncilDisclosure.recipient")}</li>
                <li>{t("studentCouncilDisclosure.purpose")}</li>
                <li>{t("studentCouncilDisclosure.information")}</li>
                <li>{t("studentCouncilDisclosure.retention")}</li>
                <li>{t("studentCouncilDisclosure.refusal")}</li>
              </StyledOl>
            </Typography>
          </Toggle>
        </Card>
        <CheckboxOption
          checked={isChecked}
          onClick={() => {
            setIsChecked(!isChecked);
          }}
          optionText={t("동의 문구")}
        />
        <Button onClick={onAgree} type={isChecked ? "default" : "disabled"}>
          {t("확인")}
        </Button>
        <TextButtonContainer>
          <TextButton
            onClick={onDisagree}
            text={isMobile ? t("미동의_모바일") : t("미동의")}
            fs={14}
            color="GRAY"
            fw="MEDIUM"
          />
        </TextButtonContainer>
      </StyledModalContainer>
    </Modal>
  );
};

export default AgreementModal;
