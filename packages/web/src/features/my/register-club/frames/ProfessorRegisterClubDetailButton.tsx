import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { overlay } from "overlay-kit";
import React from "react";

import apiReg011, {
  ApiReg011ResponseOk,
} from "@clubs/interface/api/registration/endpoint/apiReg011";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import useGetClubRegistrationDeadline from "@sparcs-clubs/web/features/clubs/services/useGetClubRegistrationDeadline";
import usePatchClubRegProfessorApprove from "@sparcs-clubs/web/features/my/services/usePatchClubRegProfessorApprove";

const ProfessorRegisterClubDetailButton: React.FC<{
  clubDetail: ApiReg011ResponseOk;
}> = ({ clubDetail }) => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { mutate } = usePatchClubRegProfessorApprove();

  const {
    data: deadlineData,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetClubRegistrationDeadline();

  const professorApproveHandler = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          onConfirm={() => {
            mutate(
              { param: { applyId: +id } },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({
                    queryKey: [apiReg011.url(String(id)), id],
                  });
                  close();
                },
              },
            );
          }}
          onClose={close}
          confirmButtonText="승인"
        >
          동아리 등록을 승인하시겠습니까?
        </CancellableModalContent>
      </Modal>
    ));
  };
  return (
    <AsyncBoundary isLoading={isLoadingDeadline} isError={isErrorDeadline}>
      {deadlineData?.deadline && (
        <FlexWrapper direction="row" gap={10}>
          <Button
            style={{ width: "max-content" }}
            onClick={professorApproveHandler}
            type={
              clubDetail && clubDetail.isProfessorSigned
                ? "disabled"
                : "default"
            }
          >
            {clubDetail && clubDetail.isProfessorSigned ? "승인 완료" : "승인"}
          </Button>
        </FlexWrapper>
      )}
    </AsyncBoundary>
  );
};

export default ProfessorRegisterClubDetailButton;
