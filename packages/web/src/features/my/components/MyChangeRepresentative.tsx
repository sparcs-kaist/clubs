import isPropValid from "@emotion/is-prop-valid";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import type { ApiClb013ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb013";
import { ClubDelegateChangeRequestStatusEnum } from "@clubs/interface/common/enum/club.enum";

import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Icon from "@sparcs-clubs/web/common/components/Icon";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import type { Profile } from "@sparcs-clubs/web/common/providers/AuthContext";
import colors from "@sparcs-clubs/web/styles/themes/colors";

import useDelegateChangeRequestModal, {
  delegateRoleLabelKeys,
} from "../hooks/useDelegateChangeRequestModal";

interface MyChangeRepresentativeProps {
  request: ApiClb013ResponseOk["requests"][number];
  profile: Profile;
}

const MyChangeRepresentativeWrapper = styled.div.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{
  status: ClubDelegateChangeRequestStatusEnum;
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
  request,
  profile,
}) => {
  const t = useTranslations("my.representative");
  const router = useRouter();
  const openConfirmation = useDelegateChangeRequestModal(profile);
  const { clubName, delegateEnumId, prevStudentName, prevStudentNumber } =
    request;
  const status = request.clubDelegateChangeRequestStatusEnumId;
  const role = t(delegateRoleLabelKeys[delegateEnumId]);
  const requester = `${prevStudentNumber} ${prevStudentName}`;
  const isPending = status === ClubDelegateChangeRequestStatusEnum.Applied;
  const title = t(isPending ? "requestedTitle" : "completedTitle", { role });
  const body = t(isPending ? "requestedBody" : "completedBody", {
    clubName,
    role,
    requester,
  });

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
            onClick={() => openConfirmation(request)}
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
