import isPropValid from "@emotion/is-prop-valid";
import React from "react";
import styled from "styled-components";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Icon from "@sparcs-clubs/web/common/components/Icon";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import colors from "@sparcs-clubs/web/styles/themes/colors";

interface ChangeRepresentativeProps {
  type: "Applied" | "Rejected";
  clubName: string;
  role: string;
  candidate: string;
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
  role,
  candidate,
}) => {
  const isPending = type === "Applied";
  return (
    <ChangeRepresentativeWrapper type={type}>
      {!isPending ? (
        <Icon type="cancel" size={20} color={colors.RED[600]} />
      ) : (
        <Icon type="check_circle" size={20} color={colors.GREEN[600]} />
      )}
      <FlexWrapper direction="column" gap={8}>
        <Typography fw="MEDIUM" fs={16} lh={20}>
          {role} 변경 요청 {isPending ? "수락 대기" : "거절"}
        </Typography>
        <Typography
          fw="REGULAR"
          fs={16}
          lh={20}
          style={{ whiteSpace: "pre-wrap" }}
        >
          {clubName} · {candidate}
        </Typography>
        {isPending && (
          <Typography fw="REGULAR" fs={16} lh={20}>
            대상자는 마이페이지에서 요청을 확인할 수 있습니다. 응답이 없으면 3일
            후 만료됩니다.
          </Typography>
        )}
      </FlexWrapper>
    </ChangeRepresentativeWrapper>
  );
};

export default ChangeRepresentativeInfo;
