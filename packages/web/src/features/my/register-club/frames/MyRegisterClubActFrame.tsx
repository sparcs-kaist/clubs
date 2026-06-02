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
  const { data, isLoading, isError } = useProvisionalActivities(profile, {
    clubId,
    semesterId,
  });
  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={16}>
        <Typography fw="MEDIUM" fs={16} lh={20}>
          가등록 / 등록 취소 기간 활동 보고서 (총{" "}
          {data ? data.activities.length : 0}개)
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
