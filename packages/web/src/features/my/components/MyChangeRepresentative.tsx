import isPropValid from "@emotion/is-prop-valid";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import React from "react";
import styled from "styled-components";

import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Icon from "@sparcs-clubs/web/common/components/Icon";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  myChangeRepresentativeFinishText,
  myChangeRepresentativeRequestText,
} from "@sparcs-clubs/web/constants/changeRepresentative";
import colors from "@sparcs-clubs/web/styles/themes/colors";

import ChangeRepresentativeModalContent from "./ChangeRepresentativeModalContent";

interface MyChangeRepresentativeProps {
  status: ClubDelegateChangeRequestStatusEnum;
  clubName: string;
  prevRepresentative: string;
  newRepresentative: string;
  requestId: number;
}

const MyChangeRepresentativeWrapper = styled.div.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{
  status: MyChangeRepresentativeProps["status"];
}>`
  display: flex;
  flex-direction: row;
  padding: 12px 16px;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid
    ${({ status, theme }) =>
      status === ClubDelegateChangeRequestStatusEnum.Applied
        ? theme.colors.RED[600]
        : theme.colors.GREEN[600]};
  background-color: ${({ status, theme }) =>
    status === ClubDelegateChangeRequestStatusEnum.Applied
      ? theme.colors.RED[100]
      : theme.colors.GREEN[100]};
`;

const MyChangeRepresentative: React.FC<MyChangeRepresentativeProps> = ({
  status,
  clubName,
  prevRepresentative,
  newRepresentative,
  requestId,
}) => {
  const router = useRouter();
  const Title =
    status === ClubDelegateChangeRequestStatusEnum.Applied
      ? "동아리 대표자 변경 요청"
      : "동아리 대표자 변경 완료";
  const Text =
    status === ClubDelegateChangeRequestStatusEnum.Applied
      ? myChangeRepresentativeRequestText(
          clubName,
          prevRepresentative,
          newRepresentative,
        )
      : myChangeRepresentativeFinishText(
          clubName,
          prevRepresentative,
          newRepresentative,
        );

  const isNewRepresentative = true; // 이전 대표자한테도 보여주는지? -> 안 보여줄거면 이 부분 삭제
  const openConfirmModal = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <ChangeRepresentativeModalContent
          needPhoneNumber
          clubName={clubName}
          prevRepresentative={prevRepresentative}
          newRepresentative={newRepresentative}
          onClose={close}
          requestId={requestId}
        />
      </Modal>
    ));
  };

  return (
    <MyChangeRepresentativeWrapper status={status}>
      {status === ClubDelegateChangeRequestStatusEnum.Applied ? (
        <Icon type="error" size={20} color={colors.RED[600]} />
      ) : (
        <Icon type="check_circle" size={20} color={colors.GREEN[600]} />
      )}
      <FlexWrapper direction="column" gap={8}>
        <Typography fw="MEDIUM" fs={16} lh={20}>
          {Title}
        </Typography>
        <Typography fs={16} lh={20} style={{ whiteSpace: "pre-wrap" }}>
          {Text}
        </Typography>
        {status === ClubDelegateChangeRequestStatusEnum.Applied && (
          <TextButton
            color="GRAY"
            text="클릭하여 더보기"
            fw="REGULAR"
            onClick={openConfirmModal}
          />
        )}
        {status === ClubDelegateChangeRequestStatusEnum.Approved &&
          isNewRepresentative && (
            <TextButton
              color="GRAY"
              text="대표 동아리 관리 페이지 바로가기"
              fw="REGULAR"
              onClick={() => {
                router.push(`/manage-club/`);
              }}
            />
          )}
      </FlexWrapper>
    </MyChangeRepresentativeWrapper>
  );
};

export default MyChangeRepresentative;
