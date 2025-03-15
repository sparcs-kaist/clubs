import React, { useEffect, useState } from "react";
import { useTheme } from "styled-components";

import { ApiClb002ResponseOK } from "@sparcs-clubs/interface/api/club/endpoint/apiClb002";
import { ApiClb006ResponseOK } from "@sparcs-clubs/interface/api/club/endpoint/apiClb006";
import { ApiClb015ResponseOk } from "@sparcs-clubs/interface/api/club/endpoint/apiClb015";
import { ApiReg008ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg008";
import { RegistrationApplicationStudentStatusEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import MoreDetailTitle from "@sparcs-clubs/web/common/components/MoreDetailTitle";
import { useGetClubDetail } from "@sparcs-clubs/web/features/clubs/services/useGetClubDetail";
import MembersTable from "@sparcs-clubs/web/features/manage-club/components/MembersTable";
import { useGetMemberRegistration } from "@sparcs-clubs/web/features/manage-club/members/services/useGetClubMemberRegistration";
import { useGetMyManageClub } from "@sparcs-clubs/web/features/manage-club/services/getMyManageClub";
import useGetSemesterNow from "@sparcs-clubs/web/utils/getSemesterNow";

import { useGetClubDelegate } from "../services/getClubDelegate";

const RegistrationManageFrame: React.FC = () => {
  // 자신이 대표자인 동아리 clubId 가져오기
  const { data: idData } = useGetMyManageClub() as {
    data: ApiClb015ResponseOk;
    isLoading: boolean;
  };

  const {
    data: delegatesNow,
    isLoading: delegatesIsLoading,
    isError: delegatesIsError,
  } = useGetClubDelegate({ clubId: idData.clubId }) as {
    data: ApiClb006ResponseOK;
    isLoading: boolean;
    isError: boolean;
  };

  // 자신이 대표자인 동아리 clubId에 해당하는 동아리 세부정보 가져오기
  const {
    data: clubData,
    isLoading: clubIsLoading,
    isError: clubIsError,
  } = useGetClubDetail(idData.clubId.toString()) as {
    data: ApiClb002ResponseOK;
    isLoading: boolean;
    isError: boolean;
  };
  const {
    data: memberData,
    isLoading: memberIsLoading,
    isError: memberIsError,
    refetch: memberRefetch,
  } = useGetMemberRegistration({ clubId: idData.clubId }) as {
    data: ApiReg008ResponseOk;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
  };

  const appliedCount =
    memberData &&
    memberData.applies.filter(
      member =>
        member.applyStatusEnumId ===
        RegistrationApplicationStudentStatusEnum.Pending,
    ).length;
  const approvedCount =
    memberData &&
    memberData.applies.filter(
      member =>
        member.applyStatusEnumId ===
        RegistrationApplicationStudentStatusEnum.Approved,
    ).length;
  const rejectedCount =
    memberData &&
    memberData.applies.filter(
      member =>
        member.applyStatusEnumId ===
        RegistrationApplicationStudentStatusEnum.Rejected,
    ).length;
  const totalCount = memberData && memberData.applies.length;

  const {
    semester: semesterInfo,
    isLoading: semesterLoading,
    isError: semesterError,
  } = useGetSemesterNow();

  const title = `${semesterInfo?.year}년 ${semesterInfo?.name}학기 (신청 ${appliedCount}명, 승인 ${approvedCount}명, 반려 ${rejectedCount}명 / 총 ${totalCount}명)`;
  const mobileTitle = `${semesterInfo?.year}년 ${semesterInfo?.name}학기`;

  const theme = useTheme();
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(
        window.innerWidth <= parseInt(theme.responsive.BREAKPOINT.sm),
      );
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <FoldableSectionTitle title="회원 명단">
      <AsyncBoundary
        isLoading={
          memberIsLoading ||
          clubIsLoading ||
          delegatesIsLoading ||
          semesterLoading
        }
        isError={
          memberIsError || clubIsError || delegatesIsError || semesterError
        }
      >
        <FlexWrapper direction="column" gap={20}>
          {memberData && clubData && (
            <>
              <MoreDetailTitle
                title={isMobileView ? mobileTitle : title}
                moreDetail="전체 보기"
                moreDetailPath="/manage-club/members"
              />

              <MembersTable
                memberList={memberData.applies}
                clubName={clubData.nameKr}
                clubId={idData.clubId}
                refetch={memberRefetch}
                delegates={delegatesNow.delegates}
              />
            </>
          )}
        </FlexWrapper>
      </AsyncBoundary>
    </FoldableSectionTitle>
  );
};

export default RegistrationManageFrame;
