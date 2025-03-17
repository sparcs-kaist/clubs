import { useQueryClient } from "@tanstack/react-query";
import { overlay } from "overlay-kit";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";

import type { ApiClb002ResponseOK } from "@sparcs-clubs/interface/api/club/endpoint/apiClb002";
import apiReg006, {
  ApiReg006ResponseOk,
} from "@sparcs-clubs/interface/api/registration/endpoint/apiReg006";
import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

import useRegisterClub from "../services/useRegisterClub";
import useUnregisterClub from "../services/useUnregisterClub";

interface RegisterInfoProps {
  club: ApiClb002ResponseOK;
  registrationStatus: RegistrationApplicationStudentStatusEnum;
  isRegistered: boolean;
  myRegistrationList: ApiReg006ResponseOk;
}
const RegisterInfoWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  flex: 1 0 0;
  align-items: center;
`;

const ResponsiveBr = styled.br`
  display: none;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    display: block;
  }
`;

export const RegisterInfo: React.FC<RegisterInfoProps> = ({
  club,
  registrationStatus,
  isRegistered,
  myRegistrationList,
}) => {
  const queryClient = useQueryClient();

  const { mutate: registerClub } = useRegisterClub();
  const { mutate: unregisterClub } = useUnregisterClub();

  const toggleRegistered = useCallback(() => {
    registerClub(
      { body: { clubId: club.id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [apiReg006.url()] });
        },
      },
    );
  }, [club]);

  const toggleUnregistered = useCallback(() => {
    const thisRegistration = myRegistrationList.applies.find(
      apply => apply.clubId === club.id,
    );
    unregisterClub(
      {
        requestParam: { applyId: thisRegistration!.id },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [apiReg006.url()] });
        },
      },
    );
  }, [myRegistrationList]);

  const { semester, isLoading, isError } = useGetSemesterNow();

  const ModalText = useMemo(
    () => (
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        {semester?.year}년도 {semester?.name}학기
        <ResponsiveBr /> {club.type === 1 ? "정동아리" : "가동아리"}{" "}
        {club.nameKr}의 <br />
        {isRegistered
          ? "회원 등록을 취소합니다."
          : "회원 등록 신청을 진행합니다."}
      </AsyncBoundary>
    ),
    [semester, club, isRegistered],
  );

  const submitHandler = useCallback(() => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen} onClose={close}>
        <CancellableModalContent
          onClose={close}
          onConfirm={() => {
            (isRegistered ? toggleUnregistered : toggleRegistered)();
            close();
          }}
        >
          {ModalText}
        </CancellableModalContent>
      </Modal>
    ));
  }, [isRegistered, ModalText]);

  const renderButton = useCallback(() => {
    if (
      registrationStatus === RegistrationApplicationStudentStatusEnum.Pending
    ) {
      return (
        <Button type="default" onClick={submitHandler}>
          회원 등록 취소
        </Button>
      );
    }
    if (
      registrationStatus === RegistrationApplicationStudentStatusEnum.Approved
    ) {
      return (
        <Button type="disabled" onClick={submitHandler}>
          회원 승인 완료
        </Button>
      );
    }
    return (
      <Button type="default" onClick={submitHandler}>
        회원 등록 신청
      </Button>
    );
  }, [registrationStatus]);

  return (
    <RegisterInfoWrapper>
      <Typography fs={16} color="GRAY.600" fw="REGULAR">
        등록 신청 {club.totalMemberCnt}명
      </Typography>
      {renderButton()}
    </RegisterInfoWrapper>
  );
};
