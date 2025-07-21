import isPropValid from "@emotion/is-prop-valid";
import React from "react";
import styled from "styled-components";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Icon from "@sparcs-clubs/web/common/components/Icon";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  changeRepresentativeCancelText,
  changeRepresentativeRefuseText,
  changeRepresentativeRequestText,
} from "@sparcs-clubs/web/constants/changeRepresentative";
import colors from "@sparcs-clubs/web/styles/themes/colors";

interface ChangeRepresentativeProps {
  type: "Applied" | "Rejected" | "Canceled";
  clubName: string;
  prevRepresentative: string;
  newRepresentative: string;
}

const ChangeRepresentativeWrapper = styled.div.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{
  type: ChangeRepresentativeProps["type"];
}>`
  display: flex;
  flex-direction: row;
  padding: 12px 16px;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid
    ${({ type, theme }) =>
      type === "Rejected" ? theme.colors.RED[600] : theme.colors.GREEN[600]};
  background-color: ${({ type, theme }) =>
    type === "Rejected" ? theme.colors.RED[100] : theme.colors.GREEN[100]};
`;

const ChangeRepresentativeInfo: React.FC<ChangeRepresentativeProps> = ({
  type,
  clubName,
  prevRepresentative,
  newRepresentative,
}) => {
  let title;
  let text;
  switch (type) {
    case "Applied":
      title = "동아리 대표자 변경 요청 완료";
      text = changeRepresentativeRequestText(
        clubName,
        prevRepresentative,
        newRepresentative,
      );
      break;
    case "Rejected":
      title = "동아리 대표자 변경 요청 거절";
      text = changeRepresentativeRefuseText(
        clubName,
        prevRepresentative,
        newRepresentative,
      );
      break;
    default:
      title = "동아리 대표자 변경 요청 취소";
      text = changeRepresentativeCancelText(clubName);
      break;
  }
  return (
    <ChangeRepresentativeWrapper type={type}>
      {type === "Rejected" ? (
        <Icon type="cancel" size={20} color={colors.RED[600]} />
      ) : (
        <Icon type="check_circle" size={20} color={colors.GREEN[600]} />
      )}
      <FlexWrapper direction="column" gap={8}>
        <Typography fw="MEDIUM" fs={16} lh={20}>
          {title}
        </Typography>
        <Typography
          fw="REGULAR"
          fs={16}
          lh={20}
          style={{ whiteSpace: "pre-wrap" }}
        >
          {text}
        </Typography>
        {type === "Applied" && (
          <Typography fw="REGULAR" fs={16} lh={20}>
            대표자 변경 요청을 취소할 수 있으며, 요청이 3일 내로 승인 또는
            거절되지 않을 경우 자동으로 취소됩니다
            <br />
            <br />
            만약 요청 받으신 분의 &apos;마이페이지&apos;에서 대표자 변경 안내
            팝업이 보이지 않는 다면 채널톡으로 문의주세요!
          </Typography>
        )}
      </FlexWrapper>
    </ChangeRepresentativeWrapper>
  );
};

export default ChangeRepresentativeInfo;
