"use client";

import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import React from "react";

import Button from "@sparcs-clubs/web/common/components/Button";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import useCancelClubRegistration from "@sparcs-clubs/web/features/clubs/services/useCancelClubRegistration";

interface ClubRegistrationCancellationButtonProps {
  clubId: number;
  clubName: string;
}

const ClubRegistrationCancellationButton = ({
  clubId,
  clubName,
}: ClubRegistrationCancellationButtonProps) => {
  const router = useRouter();
  const { mutate: cancelRegistration, isPending } =
    useCancelClubRegistration(clubId);

  const openSuccessModal = () => {
    overlay.open(({ isOpen, close }) => {
      const handleClose = () => {
        close();
        router.replace("/clubs");
      };

      return (
        <Modal isOpen={isOpen} onClose={handleClose}>
          <ConfirmModalContent onConfirm={handleClose}>
            {clubName}의 등록을 무효 처리했습니다.
          </ConfirmModalContent>
        </Modal>
      );
    });
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
          confirmButtonText="등록 무효"
        >
          {clubName}의 등록을 무효 처리하시겠습니까?
          <br />
          동아리와 대표자·대의원 임기가 즉시 종료됩니다.
        </CancellableModalContent>
      </Modal>
    ));
  };

  return (
    <Button
      type={isPending ? "disabled" : "default"}
      onClick={openConfirmationModal}
    >
      등록 무효
    </Button>
  );
};

export default ClubRegistrationCancellationButton;
