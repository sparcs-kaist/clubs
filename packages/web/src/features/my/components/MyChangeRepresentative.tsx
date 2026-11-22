import isPropValid from "@emotion/is-prop-valid";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { overlay } from "overlay-kit";
import React from "react";
import styled from "styled-components";

import {
  ClubDelegateChangeRequestStatusEnum,
  ClubDelegateEnum,
} from "@clubs/interface/common/enum/club.enum";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Icon from "@sparcs-clubs/web/common/components/Icon";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import colors from "@sparcs-clubs/web/styles/themes/colors";

import ChangeRepresentativeModalContent from "./ChangeRepresentativeModalContent";

interface MyChangeRepresentativeProps {
  status: ClubDelegateChangeRequestStatusEnum;
  clubName: string;
  delegateEnumId: ClubDelegateEnum;
  requester: string;
  requestId: number;
  profile: string;
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
  delegateEnumId,
  requester,
  requestId,
  profile,
}) => {
  const t = useTranslations("my.representative");
  const router = useRouter();
  const role = {
    [ClubDelegateEnum.Representative]: t("roles.representative"),
    [ClubDelegateEnum.Delegate1]: t("roles.delegate1"),
    [ClubDelegateEnum.Delegate2]: t("roles.delegate2"),
  }[delegateEnumId];
  const isPending = status === ClubDelegateChangeRequestStatusEnum.Applied;
  const title = t(isPending ? "requestedTitle" : "completedTitle", { role });
  const body = t(isPending ? "requestedBody" : "completedBody", {
    clubName,
    role,
    requester,
  });

  const openConfirmModal = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <ChangeRepresentativeModalContent
          clubName={clubName}
          role={role}
          requester={requester}
          onClose={close}
          profile={profile}
          requestId={requestId}
        />
      </Modal>
    ));
  };

  return (
    <MyChangeRepresentativeWrapper status={status}>
      {isPending ? (
        <Icon type="error" size={20} color={colors.RED[600]} />
      ) : (
        <Icon type="check_circle" size={20} color={colors.GREEN[600]} />
      )}
      <FlexWrapper direction="column" gap={8}>
        <Typography fw="MEDIUM" fs={16} lh={20}>
          {title}
        </Typography>
        <Typography fs={16} lh={20} style={{ whiteSpace: "pre-wrap" }}>
          {body}
        </Typography>
        {isPending && (
          <TextButton
            color="GRAY"
            text={t("viewMore")}
            fw="REGULAR"
            onClick={openConfirmModal}
          />
        )}
        {status === ClubDelegateChangeRequestStatusEnum.Approved && (
          <TextButton
            color="GRAY"
            text={t("manageClub")}
            fw="REGULAR"
            onClick={() => router.push("/manage-club/")}
          />
        )}
      </FlexWrapper>
    </MyChangeRepresentativeWrapper>
  );
};

export default MyChangeRepresentative;
