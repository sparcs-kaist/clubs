"use client";

import { overlay } from "overlay-kit";

import Button from "@sparcs-clubs/web/common/components/Button";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";

import useCancelClubRegistration from "../services/useCancelClubRegistration";

interface ClubRegistrationCancellationButtonProps {
  clubId: number;
  clubName: string;
}

const ClubRegistrationCancellationButton = ({
  clubId,
  clubName,
}: ClubRegistrationCancellationButtonProps) => {
  const { mutate: cancelRegistration, isPending } =
    useCancelClubRegistration(clubId);

  const openSuccessModal = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen} onClose={close}>
        <ConfirmModalContent onConfirm={close}>
          {clubName} 동아리의 등록을 무효 처리했습니다.
        </ConfirmModalContent>
      </Modal>
    ));
  };

  const openConfirmationModal = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen} onClose={close}>
        <CancellableModalContent
          onClose={close}
          onConfirm={() => {
            close();
            cancelRegistration(undefined, { onSuccess: openSuccessModal });
          }}
          confirmButtonText="등록 무효 처리"
          confirmButtonType="danger"
        >
          {clubName} 동아리의 등록이 무효 처리됩니다.
          <br />
          대표자·대의원 임기가 종료되고 대기 중인 회원 등록 신청이 반려됩니다.
          <br />
          계속하시겠습니까?
        </CancellableModalContent>
      </Modal>
    ));
  };

  return (
    <Button
      type={isPending ? "disabled" : "danger"}
      onClick={openConfirmationModal}
    >
      등록 무효
    </Button>
  );
};

export default ClubRegistrationCancellationButton;
