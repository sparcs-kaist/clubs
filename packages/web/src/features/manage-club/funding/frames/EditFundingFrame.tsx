import { useParams, useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import RestoreDraftModal from "@sparcs-clubs/web/common/components/Modal/RestoreDraftModal";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useTemporaryStorage from "@sparcs-clubs/web/common/hooks/useTemporaryStorage";
import LocalStorageUtil from "@sparcs-clubs/web/common/services/localStorageUtil";
import { LOCAL_STORAGE_KEY } from "@sparcs-clubs/web/constants/localStorage";

import useGetInitialFundingFormData from "../hooks/useGetInitialFundingForm";
import useUpdateFunding from "../hooks/useUpdateFunding";
import { FundingFormData } from "../types/funding";
import FundingForm from "./FundingForm";

interface EditFundingFrameProps {
  clubId: number;
}

const EditFundingFrame: React.FC<EditFundingFrameProps> = ({ clubId }) => {
  const router = useRouter();
  const { id: fundingId } = useParams<{ id: string }>();
  const cancelClick = () => {
    router.push(`/manage-club/funding/${fundingId}`);
  };

  const {
    data: funding,
    isLoading,
    isError,
  } = useGetInitialFundingFormData(+fundingId);

  const { mutateAsync: updateFunding } = useUpdateFunding(+fundingId, clubId);

  const { savedData, isModalOpen, handleConfirm, handleClose } =
    useTemporaryStorage<FundingFormData>(LOCAL_STORAGE_KEY.EDIT_FUNDING);

  const handleSubmit = (data: FundingFormData) => {
    const filteredData = Object.fromEntries(
      Object.entries(data)
        .filter(([_, value]) => value !== null) // null 값 제외
        .map(([key, value]) => [key, value]), // map을 사용하여 그대로 반환
    ) as FundingFormData;

    updateFunding(filteredData, {
      onSuccess: () => {
        LocalStorageUtil.remove(LOCAL_STORAGE_KEY.EDIT_FUNDING);
        overlay.open(({ isOpen, close }) => (
          <Modal isOpen={isOpen}>
            <ConfirmModalContent
              onConfirm={() => {
                close();
                router.push(`/manage-club/funding/${fundingId}`);
              }}
            >
              수정이 완료되었습니다. <br />
              확인을 누르면 신청 내역 화면으로 이동합니다.
            </ConfirmModalContent>
          </Modal>
        ));
      },
      onError: error => {
        overlay.open(({ isOpen, close }) => (
          <Modal isOpen={isOpen}>
            <ConfirmModalContent onConfirm={close}>
              지원금 수정에 실패했습니다.
              <Typography color="GRAY.300" fs={12} lh={16} fw="REGULAR">
                {error.message}
              </Typography>
            </ConfirmModalContent>
          </Modal>
        ));
      },
    });
  };

  if (isModalOpen) {
    return (
      <RestoreDraftModal
        isOpen={isModalOpen}
        mainText="작성하시던 지원금 수정 내역이 있습니다. 불러오시겠습니까?"
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    );
  }

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: "대표 동아리 관리", path: "/manage-club" },
          { name: "지원금", path: "/manage-club/funding" },
        ]}
        title="지원금 수정"
        enableLast
      />
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <FundingForm
          clubId={clubId}
          onCancel={cancelClick}
          onSubmit={handleSubmit}
          initialData={savedData ?? funding ?? []}
        />
      </AsyncBoundary>
    </FlexWrapper>
  );
};

export default EditFundingFrame;
