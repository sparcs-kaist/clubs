import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { overlay } from "overlay-kit";
import React from "react";

import { RegistrationStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import useGetClubRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetClubRegistrationDeadline";
import { deleteMyClubRegistration } from "@sparcs-clubs/web/features/my/services/deleteMyClubRegistration";
import { useGetMyClubRegistration } from "@sparcs-clubs/web/features/my/services/getMyClubRegistration";

const StudentRegisterClubDetailButton: React.FC = () => {
  const t = useTranslations("my.registration");
  const { id: idParam } = useParams<{ id: string }>();
  const applyId = Number(idParam);
  const router = useRouter();

  const {
    data: deadlineData,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetClubRegistrationDeadline();
  const {
    data: myClubRegistrationData,
    isLoading: isLoadingMyClubRegistration,
    isError: isErrorMyClubRegistration,
  } = useGetMyClubRegistration();

  const registration = myClubRegistrationData?.registrations.find(
    item => item.id === applyId,
  );

  const deleteHandler = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          onConfirm={async () => {
            await deleteMyClubRegistration({ applyId });
            close();
            window.location.href = "/my";
          }}
          onClose={close}
          confirmButtonText={t("delete")}
        >
          {t("deleteWarning")}
          <br />
          {t("deleteQuestion")}
        </CancellableModalContent>
      </Modal>
    ));
  };

  const editHandler = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          onConfirm={() => {
            router.push(`/my/register-club/${applyId}/edit`);
            close();
          }}
          onClose={close}
          confirmButtonText={t("edit")}
        >
          {t("editWarning")}
          <br />
          {t("editQuestion")}
        </CancellableModalContent>
      </Modal>
    ));
  };
  return (
    <AsyncBoundary
      isLoading={isLoadingDeadline || isLoadingMyClubRegistration}
      isError={isErrorDeadline || isErrorMyClubRegistration}
    >
      {deadlineData?.deadline && registration && (
        <FlexWrapper direction="row" gap={10}>
          <Button style={{ width: "max-content" }} onClick={deleteHandler}>
            {t("delete")}
          </Button>
          {registration.registrationStatusEnum !==
            RegistrationStatusEnum.Approved && (
            <Button style={{ width: "max-content" }} onClick={editHandler}>
              {t("edit")}
            </Button>
          )}
        </FlexWrapper>
      )}
    </AsyncBoundary>
  );
};

export default StudentRegisterClubDetailButton;
