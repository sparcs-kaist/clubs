import { useTranslations } from "next-intl";
import React from "react";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useProvisionalActivities from "@sparcs-clubs/web/features/register-club/services/getProvisionalActivities";

import MyRegisterClubActTable from "../components/MyRegisterClubActTable";

interface MyRegisterClubActFrameProps {
  profile: string;
  clubId: number;
  semesterId?: number;
}

const MyRegisterClubActFrame: React.FC<MyRegisterClubActFrameProps> = ({
  profile,
  clubId,
  semesterId,
}) => {
  const t = useTranslations("my.registration.activity");
  const { data, isLoading, isError } = useProvisionalActivities(profile, {
    clubId,
    semesterId,
  });
  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={16}>
        <Typography fw="MEDIUM" fs={16} lh={20}>
          {t("titleCount", { count: data?.activities.length ?? 0 })}
        </Typography>
        {data && (
          <MyRegisterClubActTable
            clubRegisterActList={data}
            profile={profile}
            clubId={clubId}
          />
        )}
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default MyRegisterClubActFrame;
