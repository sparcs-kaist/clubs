import React from "react";

import { overlay } from "overlay-kit";
import styled from "styled-components";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";

import Info from "@sparcs-clubs/web/common/components/Info";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";

import AdvancedInformFrame from "../components/AdvancedInformFrame";
import BasicInformFrame from "../components/BasicInformFrame";
import ClubRulesFrame from "../components/ClubRulesFrame";
import { RegisterClubType } from "../types/registerClub";

interface RegisterClubMainFrameProps {
  type: RegisterClubType;
}

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const RegisterClubMainFrame: React.FC<RegisterClubMainFrameProps> = ({
  type,
}) => {
  const openCompleteModal = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          onConfirm={() => {
            // TODO. 신청내역 페이지로 이동 추가
            close();
          }}
          onClose={close}
        >
          신청이 완료되었습니다.
          <br />
          확인을 누르면 신청 내역 화면으로 이동합니다.
        </CancellableModalContent>
      </Modal>
    ));
  };
  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          {
            name: `동아리 등록`,
            path: `/register-club`,
          },
        ]}
        title={`동아리 ${type} 신청`}
        enableLast
      />
      {/* TODO. 등록 기간, 신청마감 동적처리  */}
      <Info text="현재는 2024년 봄학기 동아리 등록 기간입니다 (신청 마감 : 2024년 3월 10일 23:59)" />
      <BasicInformFrame type={type} />
      <AdvancedInformFrame type={type} />
      <ClubRulesFrame isProvisional={type === RegisterClubType.provisional} />
      <ButtonWrapper>
        <Button
          type="outlined"
          onClick={() => {
            // TODO. 취소 로직 추가
          }}
        >
          취소
        </Button>
        <Button onClick={openCompleteModal}>신청</Button>
      </ButtonWrapper>
    </FlexWrapper>
  );
};

export default RegisterClubMainFrame;
