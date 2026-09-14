import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import Button, {
  ButtonProps,
} from "@sparcs-clubs/web/common/components/Button";

import FlexWrapper from "../FlexWrapper";
import Typography from "../Typography";

interface CancellableModalContentProps {
  confirmDisabled?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  closeButtonText?: string;
  confirmButtonText?: string;
  confirmButtonType?: ButtonProps["type"];
  children: React.ReactNode;
}

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const CancellableModalContent: React.FC<CancellableModalContentProps> = ({
  confirmDisabled = false,
  onClose,
  onConfirm,
  children,
  closeButtonText,
  confirmButtonText,
  confirmButtonType = "default",
}) => {
  const t = useTranslations("common");
  return (
    <FlexWrapper direction="column" gap={12}>
      <Typography fs={16} lh={28} fw="MEDIUM" style={{ textAlign: "center" }}>
        {children}
      </Typography>
      <ButtonWrapper>
        <Button type="outlined" onClick={onClose}>
          {closeButtonText ?? t("cancel")}
        </Button>
        <Button
          type={confirmDisabled ? "disabled" : confirmButtonType}
          onClick={onConfirm}
        >
          {confirmButtonText ?? t("confirm")}
        </Button>
      </ButtonWrapper>
    </FlexWrapper>
  );
};

export default CancellableModalContent;
