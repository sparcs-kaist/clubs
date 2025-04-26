import { useRouter } from "next/navigation";
import React from "react";

import { ApiClb015ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb015";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import IconButton from "@sparcs-clubs/web/common/components/Buttons/IconButton";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import Info from "@sparcs-clubs/web/common/components/Info";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { useGetMyManageClub } from "@sparcs-clubs/web/features/manage-club/services/getMyManageClub";

import CurrentActivityReportTable from "../components/CurrentActivityReportTable";
import PastActivityReportList from "../components/PastActivityReportTable";
import {
  MAX_ACTIVITY_REPORT_COUNT,
  newActivityReportListSectionInfoText,
} from "../constants";
import useGetCurrentActivityReportList from "../hooks/useGetCurrentActivityReportList";
import useGetActivityDeadline from "../services/useGetActivityDeadline";
import useGetActivityTerms from "../services/useGetActivityTerms";

interface ActivityReportMainFrameProps {
  clubId: number;
}

const ActivityReportMainFrame: React.FC<ActivityReportMainFrameProps> = ({
  clubId,
}) => {
  const router = useRouter();

  const { data } = useGetMyManageClub() as {
    data: ApiClb015ResponseOk;
    isLoading: boolean;
  };

  const {
    data: activityReportList,
    isLoading: isLoadingActivityReportList,
    isError: isErrorActivityReportList,
  } = useGetCurrentActivityReportList(clubId);
  const {
    data: activityTerms,
    isLoading: isLoadingActivityTerms,
    isError: isErrorActivityTerms,
  } = useGetActivityTerms({ clubId: data.clubId });
  const {
    data: deadline,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetActivityDeadline();

  const isLoading =
    isLoadingActivityReportList || isLoadingActivityTerms || isLoadingDeadline;
  const isError =
    isErrorActivityReportList || isErrorActivityTerms || isErrorDeadline;

  if (!activityTerms) {
    return null;
  }

  return (
    <FlexWrapper direction="column" gap={60}>
      <PageHead
        items={[
          { name: "대표 동아리 관리", path: "/manage-club" },
          { name: "활동 보고서", path: "/manage-club/activity-report" },
        ]}
        title="활동 보고서"
      />
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <FoldableSectionTitle childrenMargin="20px" title="신규 활동 보고서">
          <FlexWrapper direction="column" gap={20}>
            <Info text={newActivityReportListSectionInfoText(deadline)} />
            <FlexWrapper
              direction="row"
              gap={16}
              justify="flex-end"
              style={{ alignItems: "center" }}
            >
              <Typography fs={14} lh={20} color="GRAY.300">
                활동 보고서는 최대 20개까지 작성 가능합니다
              </Typography>
              {deadline?.isWritable && (
                <IconButton
                  type={
                    activityReportList.length >= MAX_ACTIVITY_REPORT_COUNT
                      ? "disabled"
                      : "default"
                  }
                  icon="add"
                  onClick={() => {
                    router.push("/manage-club/activity-report/create");
                  }}
                >
                  활동 보고서 작성
                </IconButton>
              )}
            </FlexWrapper>

            <CurrentActivityReportTable clubId={data.clubId} />
          </FlexWrapper>
        </FoldableSectionTitle>

        <FoldableSectionTitle title="과거 활동 보고서">
          <FlexWrapper direction="column" gap={40}>
            {activityTerms.terms
              .toReversed()
              .filter(term => {
                if (!deadline) return true;

                // 신규 활동 보고서는 빼고, 과거 활동 보고서만 보여주기
                return (
                  new Date(term.startTerm).getTime() !==
                    new Date(deadline.targetTerm.startTerm).getTime() &&
                  new Date(term.endTerm).getTime() !==
                    new Date(deadline.targetTerm.endTerm).getTime()
                );
              })
              .map(term => (
                <PastActivityReportList
                  key={term.id}
                  termId={term.id}
                  clubId={data.clubId}
                />
              ))}
          </FlexWrapper>
        </FoldableSectionTitle>
      </AsyncBoundary>
    </FlexWrapper>
  );
};

export default ActivityReportMainFrame;
