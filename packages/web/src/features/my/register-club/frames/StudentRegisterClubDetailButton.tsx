import { useParams, useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import { deleteMyClubRegistration } from "@sparcs-clubs/web/features/my/services/deleteMyClubRegistration";
import { useGetMyClubRegistration } from "@sparcs-clubs/web/features/my/services/getMyClubRegistration";
import useGetClubRegistrationPeriod from "@sparcs-clubs/web/features/register-club/hooks/useGetClubRegistrationPeriod";

const StudentRegisterClubDetailButton: React.FC = () => {
  const { id } = useParams();
  const router = useRouter();

  const {
    data: deadlineData,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetClubRegistrationPeriod();
  const {
    data: myClubRegistrationData,
    isLoading: isLoadingMyClubRegistration,
    isError: isErrorMyClubRegistration,
  } = useGetMyClubRegistration();

  const isMyRegistration =
    myClubRegistrationData && myClubRegistrationData?.registrations.length > 0;

  const deleteHandler = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          onConfirm={async () => {
            await deleteMyClubRegistration({ applyId: +id });
            close();
            window.location.href = "/my";
          }}
          onClose={close}
          confirmButtonText="삭제"
        >
          동아리 등록 신청을 삭제하면 복구할 수 없습니다.
          <br />
          삭제하시겠습니까?
        </CancellableModalContent>
      </Modal>
    ));
  };

  const editHandler = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          onConfirm={() => {
            router.push(`/my/register-club/${id}/edit`);
            close();
          }}
          onClose={close}
          confirmButtonText="수정"
        >
          동아리 등록 신청을 수정하면 신청 상태 및 지도교수 승인 여부가 모두
          초기화됩니다.
          <br />
          수정하시겠습니까?
        </CancellableModalContent>
      </Modal>
    ));
  };
  return (
    <AsyncBoundary
      isLoading={isLoadingDeadline || isLoadingMyClubRegistration}
      isError={isErrorDeadline || isErrorMyClubRegistration}
    >
      {deadlineData.isClubRegistrationPeriod && isMyRegistration && (
        <FlexWrapper direction="row" gap={10}>
          <Button style={{ width: "max-content" }} onClick={deleteHandler}>
            삭제
          </Button>
          <Button style={{ width: "max-content" }} onClick={editHandler}>
            수정
          </Button>
        </FlexWrapper>
      )}
    </AsyncBoundary>
  );
};

export default StudentRegisterClubDetailButton;
