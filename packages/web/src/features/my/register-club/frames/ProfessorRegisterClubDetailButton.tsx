import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { overlay } from "overlay-kit";
import React from "react";

import { ApiReg011ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg011";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import usePatchClubRegProfessorApprove from "@sparcs-clubs/web/features/my/services/usePatchClubRegProfessorApprove";

const ProfessorRegisterClubDetailButton: React.FC<{
  clubDetail: ApiReg011ResponseOk;
}> = ({ clubDetail }) => {
  const t = useTranslations("my.registration");
  const { id: idParam } = useParams<{ id: string }>();
  const applyId = Number(idParam);

  const { mutate } = usePatchClubRegProfessorApprove();

  const professorApproveHandler = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          onConfirm={() => {
            mutate(
              { param: { applyId } },
              {
                onSuccess: () => {
                  errorHandler(t("approveSuccess"));
                  close();
                  window.location.reload();
                },
                onError: () => {
                  errorHandler(t("approveFailure"));
                  close();
                },
              },
            );
          }}
          onClose={close}
          confirmButtonText={t("approve")}
        >
          {t("approveQuestion")}
        </CancellableModalContent>
      </Modal>
    ));
  };
  return (
    <FlexWrapper direction="row" gap={10}>
      <Button
        style={{ width: "max-content" }}
        onClick={professorApproveHandler}
        type={
          clubDetail && clubDetail.isProfessorSigned ? "disabled" : "default"
        }
      >
        {clubDetail && clubDetail.isProfessorSigned
          ? t("approved")
          : t("approve")}
      </Button>
    </FlexWrapper>
  );
};

export default ProfessorRegisterClubDetailButton;
