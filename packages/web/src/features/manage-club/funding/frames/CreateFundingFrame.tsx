import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import RestoreDraftModal from "@sparcs-clubs/web/common/components/Modal/RestoreDraftModal";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useTemporaryStorage from "@sparcs-clubs/web/common/hooks/useTemporaryStorage";
import LocalStorageUtil from "@sparcs-clubs/web/common/services/localStorageUtil";
import { LOCAL_STORAGE_KEY } from "@sparcs-clubs/web/constants/localStorage";

import { useCreateFunding } from "../hooks/useCreateFunding";
import { FundingFormData } from "../types/funding";
import FundingForm from "./FundingForm";

interface CreateFundingFrameProps {
  clubId: number;
}

const CreateFundingFrame: React.FC<CreateFundingFrameProps> = ({ clubId }) => {
  const router = useRouter();
  const fundingCancelClick = () => {
    router.push("/manage-club/funding");
  };

  const { mutate: createFunding } = useCreateFunding(clubId);

  const { savedData, isModalOpen, handleConfirm, handleClose } =
    useTemporaryStorage<FundingFormData>(LOCAL_STORAGE_KEY.CREATE_FUNDING);

  const handleSubmit = (data: FundingFormData) => {
    createFunding(data, {
      onSuccess: () => {
        LocalStorageUtil.remove(LOCAL_STORAGE_KEY.CREATE_FUNDING);
        overlay.open(({ isOpen, close }) => (
          <Modal isOpen={isOpen}>
            <ConfirmModalContent
              onConfirm={() => {
                close();
                router.push("/manage-club/funding");
              }}
            >
              신청이 완료되었습니다. <br />
              확인을 누르면 신청 내역 화면으로 이동합니다.
            </ConfirmModalContent>
          </Modal>
        ));
      },
      onError: error => {
        overlay.open(({ isOpen, close }) => (
          <Modal isOpen={isOpen}>
            <ConfirmModalContent onConfirm={close}>
              지원금 신청에 실패했습니다.
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
        mainText="작성하시던 지원금 신청 내역이 있습니다. 불러오시겠습니까?"
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
        title="지원금 신청"
        enableLast
      />
      <FundingForm
        clubId={clubId}
        onCancel={fundingCancelClick}
        onSubmit={handleSubmit}
        initialData={savedData}
      />
    </FlexWrapper>
  );
};

export default CreateFundingFrame;
