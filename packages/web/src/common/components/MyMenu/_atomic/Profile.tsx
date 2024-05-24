import React from "react";
import styled from "styled-components";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import Icon from "@sparcs-clubs/web/common/components/Icon";

interface ProfileProps {
  profileName: string;
  profileNumber: number;
  email: string;
  isSelected?: boolean;
}

const ProfileWrapper = styled.div<{ isSelected: boolean }>`
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 300px;
  border-radius: 4px;
  padding: 8px 12px;
  align-items: center;
  border: ${({ theme, isSelected }) =>
    isSelected ? `1px solid ${theme.colors.GRAY[200]}` : "none"};
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
}) => (
  <ProfileWrapper isSelected={isSelected}>
    <ProfileText>
      <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20} color="BLACK">
        {profileName}
      </Typography>
      <Typography ff="PRETENDARD" fw="REGULAR" fs={14} lh={16} color="GRAY.600">
        {profileNumber} / {email}
      </Typography>
    </ProfileText>
    {isSelected && <Icon type="check" size={16} color="BLACK" />}
  </ProfileWrapper>
);

export default Profile;
