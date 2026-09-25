"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Pagination from "@sparcs-clubs/web/common/components/Pagination";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useQueryState from "@sparcs-clubs/web/common/hooks/useQueryState";
import { MeetingNoticeItem } from "@sparcs-clubs/web/features/meeting/components/MeetingNoticeItem";
import {
  MEETING_LIST_PAGINATION_LIMIT,
  MEETING_PATH,
} from "@sparcs-clubs/web/features/meeting/constants";
import useGetMeetings from "@sparcs-clubs/web/features/meeting/services/useGetMeetings";
import {
  getMeetingEnumFromValue,
  meetingEnumToText,
  MeetingNoticeItemType,
} from "@sparcs-clubs/web/features/meeting/types/meeting";

const MeetingNoticeListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  align-self: stretch;
  border-bottom: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
`;

const MeetingNoticeHeaderWrapper = styled.div`
  display: flex;
  padding: 8px;
  justify-content: center;
  align-items: center;
  gap: 20px;
  align-self: stretch;
  border-bottom: 1px solid ${({ theme }) => theme.colors.GRAY[200]};
`;

const MeetingNoticeHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex: 1 0 0;
`;

const MeetingNoticeStatusHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
`;

const MeetingNoticeContentHeader = styled.div`
  display: flex;
  flex: 1 0 0;
  justify-content: center;
  align-items: center;
`;

const MeetingNoticeDateHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 84px;
`;

const ListWithPaginationWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex: 1;
  align-self: stretch;
`;

const MeetingMainFrame: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useQueryState<number>("page", 1);

  const meetingEnumId = getMeetingEnumFromValue(searchParams.get("type"));

  const { data, isLoading, isError } = useGetMeetings({
    meetingEnumId,
    pageOffset: page,
    itemCount: MEETING_LIST_PAGINATION_LIMIT,
  });

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper gap={60} direction="column">
        <PageHead
          items={[
            {
              name: meetingEnumId
                ? meetingEnumToText(meetingEnumId.toString())
                : "전체 회의",
              path: MEETING_PATH(meetingEnumId),
            },
          ]}
          title={
            meetingEnumId
              ? meetingEnumToText(meetingEnumId.toString())
              : "전체 회의"
          }
        />
        <ListWithPaginationWrapper>
          <MeetingNoticeListWrapper>
            <MeetingNoticeHeaderWrapper>
              <MeetingNoticeHeader>
                <MeetingNoticeStatusHeader>
                  <Typography>상태</Typography>
                </MeetingNoticeStatusHeader>
                <MeetingNoticeContentHeader>
                  <Typography>회의</Typography>
                </MeetingNoticeContentHeader>
                <MeetingNoticeDateHeader>
                  <Typography>회의 일자</Typography>
                </MeetingNoticeDateHeader>
              </MeetingNoticeHeader>
            </MeetingNoticeHeaderWrapper>
            {data?.items.map((e: MeetingNoticeItemType) => (
              <MeetingNoticeItem
                key={e.id}
                data={e}
                onClick={() => router.push(`/meeting/${e.id}`)}
              />
            ))}
          </MeetingNoticeListWrapper>
          <Pagination
            totalPage={
              data ? Math.ceil(data.total / MEETING_LIST_PAGINATION_LIMIT) : 0
            }
            currentPage={page}
            limit={MEETING_LIST_PAGINATION_LIMIT}
            setPage={setPage}
          />
        </ListWithPaginationWrapper>
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default MeetingMainFrame;
