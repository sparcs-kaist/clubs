import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import Button from "@sparcs-clubs/web/common/components/Button";

import FlexWrapper from "../FlexWrapper";
import Typography from "../Typography";

interface ConfirmModalContentProps {
  onConfirm: () => void;
  confirmButtonText?: string;
  children: React.ReactNode;
}

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ConfirmModalContent: React.FC<ConfirmModalContentProps> = ({
  onConfirm,
  children,
  confirmButtonText,
}) => {
  const t = useTranslations("common");
  return (
    <FlexWrapper direction="column" gap={12}>
      <Typography fs={16} lh={28} fw="MEDIUM" style={{ textAlign: "center" }}>
        {children}
      </Typography>
      <ButtonWrapper>
        <Button onClick={onConfirm}>{confirmButtonText ?? t("confirm")}</Button>
      </ButtonWrapper>
    </FlexWrapper>
  );
};

export default ConfirmModalContent;
