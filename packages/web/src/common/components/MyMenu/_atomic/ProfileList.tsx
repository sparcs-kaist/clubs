import { jwtDecode, JwtPayload } from "jwt-decode";
import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import Typography from "@sparcs-clubs/web/common/components/Typography";
import { setLocalStorageItem } from "@sparcs-clubs/web/utils/localStorage";

import Profile from "./Profile";

interface ProfileListProps {
  profiles: {
    profileType: string;
    token: string;
  }[];
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedToken: string;
  setSelectedToken: React.Dispatch<React.SetStateAction<string>>;
}

interface DecodedToken extends JwtPayload {
  studentNumber: number;
  email: string;
}

const ProfileListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const ProfileList: React.FC<ProfileListProps> = ({
  profiles,
  setIsMenuOpen,
  selectedToken,
  setSelectedToken,
}) => {
  const t = useTranslations("common");
  const handleProfileClick = (profile: {
    profileType: string;
    token: string;
  }) => {
    setSelectedToken(profile.token);
    setLocalStorageItem("accessToken", profile.token);
    setIsMenuOpen(false);
  };

  return (
    <ProfileListWrapper>
      <Typography fw="MEDIUM" fs={14} lh={16}>
        {t("selectAccount")}
      </Typography>
      {profiles.map(profile => {
        const decodedToken: DecodedToken = jwtDecode(profile.token);
        return (
          <Profile
            key={profile.profileType}
            profileName={profile.profileType}
            profileNumber={decodedToken.studentNumber}
            email={decodedToken.email}
            isSelected={selectedToken === profile.token}
            onClick={() => handleProfileClick(profile)}
          />
        );
      })}
    </ProfileListWrapper>
  );
};
export default ProfileList;
