"use client";

import axios from "axios";
import { useParams } from "next/navigation";

import NotFound from "@sparcs-clubs/web/app/not-found";
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

  const { id: idParam } = useParams<{ id: string }>();
  const parsedId = Number(idParam);
  const isValidId = Number.isInteger(parsedId) && parsedId > 0;
  const clubId = isValidId ? parsedId.toString() : "";
  const { data, isLoading, isError, error } = useGetClubDetail(clubId, {
    enabled: isValidId,
  });
  const { isLoggedIn, profile } = useAuth();
  const isNotFoundError =
    axios.isAxiosError(error) && error.response?.status === 404;

  if (!isValidId || isNotFoundError || (!isLoading && !data)) {
    return <NotFound />;
  }

  return (
    <AsyncBoundary
      isLoading={isLoading}
      isError={isError && !isNotFoundError}
      renderIfError={<NotFound />}
    >
      {isLoggedIn && isStudent(profile)
        ? data && <ClubDetailStudentFrame club={data} />
        : data && <ClubDetailPublicFrame club={data} />}
    </AsyncBoundary>
  );
};
export default ClubDetail;
