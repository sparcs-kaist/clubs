import { useTranslations } from "next-intl";
import { overlay } from "overlay-kit";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";

import type { ApiClb002ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb002";
import { ApiReg006ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg006";
import { RegistrationApplicationStudentStatusEnum } from "@clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

import useGetMemberRegistrationCount from "../services/useGetMemberRegistrationCount";
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
  const t = useTranslations("club");
  const { mutate: registerClub } = useRegisterClub({ clubId: club.id });
  const { mutate: unregisterClub } = useUnregisterClub(club.id);
  const {
    data: registrationCount,
    isLoading: isLoadingCount,
    isError: isErrorCount,
  } = useGetMemberRegistrationCount({ clubId: club.id });

  const toggleUnregistered = useCallback(() => {
    const thisRegistration = myRegistrationList.applies.find(
      apply => apply.clubId === club.id,
    );
    unregisterClub({
      requestParam: { applyId: thisRegistration!.id },
    });
  }, [myRegistrationList]);

  const { semester, isLoading, isError } = useGetSemesterNow();

  const ModalText = useMemo(
    () => (
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        {semester?.year}년도 {semester?.name}학기
        <ResponsiveBr /> {club.type === 1 ? t("정동아리") : t("가동아리")}{" "}
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
            (isRegistered ? toggleUnregistered : registerClub)();
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
      <AsyncBoundary isLoading={isLoadingCount} isError={isErrorCount}>
        <Typography fs={16} color="GRAY.600">
          등록 신청 {registrationCount?.totalMemberRegistrationCount ?? 0}명
        </Typography>
      </AsyncBoundary>
      {renderButton()}
    </RegisterInfoWrapper>
  );
};
