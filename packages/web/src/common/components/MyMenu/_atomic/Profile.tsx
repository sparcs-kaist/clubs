import isPropValid from "@emotion/is-prop-valid";
import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import Icon from "@sparcs-clubs/web/common/components/Icon";
import Typography from "@sparcs-clubs/web/common/components/Typography";

interface ProfileProps {
  profileName: string;
  profileNumber: number;
  email: string;
  isSelected?: boolean;
  onClick: () => void;
}

const ProfileWrapper = styled.div.withConfig({
  shouldForwardProp: prop => isPropValid(prop),
})<{ selected: boolean }>`
  display: flex;
  flex-direction: row;
  gap: 8px;
  flex: 1;
  border-radius: 4px;
  padding: 8px 12px;
  align-items: center;
  cursor: pointer;
  border: ${({ theme, selected }) =>
    selected ? `1px solid ${theme.colors.GRAY[200]}` : `1px solid transparent`};
  &:hover {
    background-color: ${({ theme }) => theme.colors.GRAY[200]};
  }
`;

const ProfileText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const Profile: React.FC<ProfileProps> = ({
  profileName,
  profileNumber,
  email,
  isSelected = false,
  onClick,
}) => {
  const t = useTranslations();
  const profileText = (number: number, mail: string) => {
    if (number && mail) return `${number} / ${mail}`;
    if (number === undefined || number === null) return `${mail}`;
    if (mail === undefined || mail === null || mail === "") return `${number}`;
    return "";
  };

  return (
    <ProfileWrapper selected={isSelected} onClick={onClick}>
      <ProfileText>
        <Typography fw="MEDIUM" fs={16} lh={20} color="BLACK">
          {t(`common.${profileName}`)}
        </Typography>
        <Typography fs={14} lh={16} color="GRAY.600">
          {profileText(profileNumber, email)}
        </Typography>
      </ProfileText>
      {isSelected && <Icon type="check" size={16} color="BLACK" />}
    </ProfileWrapper>
  );
};

export default Profile;
