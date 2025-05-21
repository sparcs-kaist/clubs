"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import {
  dateTime,
  endTerm,
  isRegular,
  location,
  locationEn,
  meetingType,
  startDate,
} from "@sparcs-clubs/web/features/meeting/constants/meetingTemplate";
import useDeleteMeeting from "@sparcs-clubs/web/features/meeting/services/useDeleteMeeting";
import useGetMeetingDetail from "@sparcs-clubs/web/features/meeting/services/useGetMeetingDetail";
import { meetingEnumToText } from "@sparcs-clubs/web/features/meeting/types/meeting";
import {
  formatDateTime,
  formatDateTimeEn,
} from "@sparcs-clubs/web/utils/Date/formatDate";

const RowStretchWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
`;

const MeetingDetailFrame: React.FC = () => {
  const router = useRouter();
  const { id } = useParams();

  const { data, isLoading, isError } = useGetMeetingDetail(+id);
  const { mutate, isPending: isDeleteLoading } = useDeleteMeeting();

  const deleteHandler = useCallback(() => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          onConfirm={() => {
            mutate(
              { param: { announcementId: +id } },
              {
                onSuccess: () => {
                  router.replace("/meeting");
                },
                onError: () => errorHandler("삭제에 실패하였습니다"),
              },
            );
            close();
          }}
          onClose={close}
        >
          공고를 삭제하면 복구할 수 없습니다.
          <br />
          ㄱㅊ?
        </CancellableModalContent>
      </Modal>
    ));
  }, [id, mutate, router]);

  const announcementTitle = useMemo(() => {
    if (data == null) return "";
    let title = data.announcementTitle;

    title = title.replace(
      meetingType,
      meetingEnumToText(data.meetingEnumId.toString()),
    );
    title = title.replace(
      isRegular,
      data.isRegular ? "정기회의" : "비정기회의",
    );

    return title;
  }, [data]);

  const announcementContent = useMemo(() => {
    if (data == null) return "";
    let content = data.announcementContent;

    content = content.replace(
      meetingType,
      meetingEnumToText(data.meetingEnumId.toString()),
    );
    content = content.replace(
      isRegular,
      data.isRegular ? "정기회의" : "비정기회의",
    );

    content = content.replace(dateTime, formatDateTime(data.startDate));
    content = content.replace(dateTime, formatDateTimeEn(data.startDate));
    content = content.replace(startDate, formatDateTime(data.startDate));
    if (data.endTerm != null) {
      content = content.replace(endTerm, formatDateTime(data.endTerm));
    }

    content = content.replace(location, data.location);
    content = content.replace(locationEn, data.locationEn);

    return content;
  }, [data]);

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={60}>
        <PageHead
          items={[{ name: "의결기구", path: `/meeting` }]}
          title={announcementTitle}
          enableLast
        />
        <Card outline>
          <Typography fs={16} lh={20} style={{ whiteSpace: "pre-line" }}>
            {announcementContent}
          </Typography>
        </Card>
        <RowStretchWrapper>
          <Link href="/meeting">
            <Button type="default">목록으로 돌아가기</Button>
          </Link>
          <FlexWrapper direction="row" gap={10}>
            <Button
              type={isDeleteLoading ? "disabled" : "default"}
              onClick={deleteHandler}
            >
              삭제
            </Button>
            <Link href={`/meeting/${id}/edit`}>
              <Button type={isDeleteLoading ? "disabled" : "default"}>
                수정
              </Button>
            </Link>
          </FlexWrapper>
        </RowStretchWrapper>
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default MeetingDetailFrame;
