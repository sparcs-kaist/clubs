"use client";

import { useParams } from "next/navigation";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import useEasterEgg from "@sparcs-clubs/web/common/hooks/useEasteregg";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import ClubDetailPublicFrame from "@sparcs-clubs/web/features/clubs/frames/detail/ClubDetailPublicFrame";
import ClubDetailStudentFrame from "@sparcs-clubs/web/features/clubs/frames/detail/ClubDetailStudentFrame";
import { useGetClubDetail } from "@sparcs-clubs/web/features/clubs/services/useGetClubDetail";
import isStudent from "@sparcs-clubs/web/utils/isStudent";

const ClubDetail = () => {
  // 이스터에그_리크루팅
  useEasterEgg();

  const { id } = useParams();
  const { data, isLoading, isError } = useGetClubDetail(String(id));
  const { isLoggedIn, profile } = useAuth();

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      {isLoggedIn && isStudent(profile)
        ? data && <ClubDetailStudentFrame club={data} />
        : data && <ClubDetailPublicFrame club={data} />}
    </AsyncBoundary>
  );
};
export default ClubDetail;
