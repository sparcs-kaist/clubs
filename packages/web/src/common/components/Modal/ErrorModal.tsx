import { useTranslations } from "next-intl";
import { overlay } from "overlay-kit";
import React from "react";

import Modal from ".";
import ConfirmModalContent from "./ConfirmModalContent";

export interface ErrorModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  message?: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onConfirm,
  message,
}) => {
  const t = useTranslations("common");
  return (
    <Modal isOpen={isOpen}>
      <ConfirmModalContent onConfirm={onConfirm}>
        {message ?? t("failed")}
      </ConfirmModalContent>
    </Modal>
  );
};

export default ErrorModal;

export const errorHandler = (message?: string) => {
  overlay.open(({ isOpen, close }) => (
    <ErrorModal isOpen={isOpen} message={message} onConfirm={close} />
  ));
};
