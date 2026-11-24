import { useTranslations } from "next-intl";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import MoreDetailTitle from "@sparcs-clubs/web/common/components/MoreDetailTitle";
import { useAuth } from "@sparcs-clubs/web/common/providers/AuthContext";
import MyClubTable from "@sparcs-clubs/web/features/my/components/MyClubTable";
import { useGetMyClubRegistration } from "@sparcs-clubs/web/features/my/services/getMyClubRegistration";

const ClubRegistrationApplicationsFrame = ({ clubId }: { clubId: number }) => {
  const t = useTranslations("registrationHistory");
  const { profile } = useAuth();
  const { data, isLoading, isError } = useGetMyClubRegistration({
    clubId,
    viewerId: profile?.studentId ?? profile?.id,
    refetchOnMount: "always",
  });

  return (
    <section aria-label={t("managementTitle")}>
      <FoldableSectionTitle title={t("managementTitle")}>
        <FlexWrapper direction="column" gap={16}>
          <MoreDetailTitle
            title={t("currentApplications")}
            moreDetail={t("viewAll")}
            moreDetailPath={`/my/register-club/previous?clubId=${clubId}`}
          />
          <AsyncBoundary isLoading={isLoading} isError={isError}>
            {data && <MyClubTable clubRegisterList={data} />}
          </AsyncBoundary>
        </FlexWrapper>
      </FoldableSectionTitle>
    </section>
  );
};

export default ClubRegistrationApplicationsFrame;
