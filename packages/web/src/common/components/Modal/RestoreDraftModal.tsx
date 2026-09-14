import { useTranslations } from "next-intl";
import React from "react";

import Typography from "../Typography";
import Modal from ".";
import CancellableModalContent from "./CancellableModalContent";

interface RestoreDraftModalProps {
  isOpen: boolean;
  mainText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const RestoreDraftModal: React.FC<RestoreDraftModalProps> = ({
  isOpen,
  mainText = undefined,
  onConfirm,
  onClose,
}) => {
  const t = useTranslations("common");
  return (
    <Modal isOpen={isOpen}>
      <CancellableModalContent
        confirmButtonText={t("draft.restore")}
        closeButtonText={t("draft.startNew")}
        onConfirm={onConfirm}
        onClose={onClose}
      >
        {mainText ?? t("draft.message")}
        <Typography color="GRAY.600" fs={12} lh={16} fw="REGULAR">
          {t("draft.description")}
        </Typography>
      </CancellableModalContent>
    </Modal>
  );
};

export default RestoreDraftModal;
