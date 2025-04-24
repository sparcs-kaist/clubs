"use client";

import { overlay } from "overlay-kit";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";

import { ApiReg006ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg006";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import useRegisterClub from "@sparcs-clubs/web/features/clubs/services/useRegisterClub";
import useUnregisterClub from "@sparcs-clubs/web/features/clubs/services/useUnregisterClub";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

import { ClubDetail } from "../types";

interface ClubRegistrationButtonProps {
  club: ClubDetail;
  isMobile?: boolean;
  isRegistered: boolean;
  isInClub: boolean;
  myRegistrationList: ApiReg006ResponseOk;
}

const ResponsiveBr = styled.br`
  display: none;
  @media (max-width: ${({ theme }) => theme.responsive.BREAKPOINT.sm}) {
    display: block;
  }
`;

const ClubRegistrationButton: React.FC<ClubRegistrationButtonProps> = ({
  club,
  isMobile = false,
  isRegistered,
  isInClub,
  myRegistrationList,
}) => {
  const { mutate: registerClub } = useRegisterClub({ clubId: club.id });
  const { mutate: unregisterClub } = useUnregisterClub(club.id);
  const { semester: semesterInfo } = useGetSemesterNow();

  const toggleUnregistered = useCallback(() => {
    const thisRegistration = myRegistrationList.applies.find(
      apply => apply.clubId === club.id,
    );
    unregisterClub({ requestParam: { applyId: thisRegistration!.id } });
  }, [myRegistrationList]);

  const ModalText = useMemo(
    () => (
      <>
        {semesterInfo?.year}년도 {semesterInfo?.name}학기
        <ResponsiveBr /> {club.type === 1 ? "정동아리" : "가동아리"}{" "}
        {club.nameKr}의 <br />
        {isRegistered
          ? "회원 등록을 취소합니다."
          : "회원 등록 신청을 진행합니다."}
      </>
    ),
    [semesterInfo, club, isRegistered],
  );

  const handleRegister = useCallback(() => {
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

  return isInClub ? (
    <TextButton text="승인 완료" disabled fs={isMobile ? 14 : 16} />
  ) : (
    <TextButton
      text={isRegistered ? "신청 취소" : "등록 신청"}
      onClick={handleRegister}
      fs={isMobile ? 14 : 16}
    />
  );
};

export default ClubRegistrationButton;
