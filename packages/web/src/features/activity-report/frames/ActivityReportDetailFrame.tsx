"use client";

import { useParams, useRouter } from "next/navigation";
import { overlay } from "overlay-kit";
import React, { useCallback, useMemo } from "react";
import styled from "styled-components";

import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import NotFound from "@sparcs-clubs/web/app/not-found";
import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import ThumbnailPreviewList from "@sparcs-clubs/web/common/components/File/ThumbnailPreviewList";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import List from "@sparcs-clubs/web/common/components/List";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import { Profile } from "@sparcs-clubs/web/common/providers/AuthContext";
import { getActivityTypeLabel } from "@sparcs-clubs/web/types/activityType";
import {
  getProfessorApprovalLabel,
  getProfessorApprovalTagColor,
} from "@sparcs-clubs/web/types/professorApproval";
import {
  formatDate,
  formatDotDetailDate,
} from "@sparcs-clubs/web/utils/Date/formatDate";

import ActivityReportStatusSection from "../components/ActivityReportStatusSection";
import ExecutiveActivityReportApprovalSection from "../components/ExecutiveActivityReportApprovalSection";
import useGetActivityReportDetail from "../hooks/useGetActivityReportDetail";
import useProfessorApproveSingleActivityReport from "../hooks/useProfessorApproveSingleActivityReport";
import { useDeleteActivityReport } from "../services/useDeleteActivityReport";
import useGetActivityDeadline from "../services/useGetActivityDeadline";
import { filterActivityComments } from "../utils/filterComment";

interface ActivitySectionProps extends React.PropsWithChildren {
  label: string;
}

const ActivitySection: React.FC<ActivitySectionProps> = ({
  label,
  children = null,
}) => (
  <FlexWrapper
    direction="column"
    gap={16}
    style={{ alignItems: "flex-start", alignSelf: "stretch" }}
  >
    <Typography
      fw="MEDIUM"
      fs={16}
      lh={20}
      style={{ paddingLeft: "2px", paddingRight: "2px" }}
    >
      {label}
    </Typography>
    {children}
  </FlexWrapper>
);
// ActivitySection은 활동 보고서에서 구분된 각 영역을 나타냅니다.
// label prop으로 이름을 넣고, children으로 List 컴포넌트 또는 기타 children을 넣어주세요.
// 들여쓰기가 필요한 경우 FlexWrapper를 활용해 주세요.

const FilePreviewContainerWrapper = styled(FlexWrapper)`
  padding-left: 24px;
  align-items: flex-start;
  align-self: stretch;
`;

const FilePreviewContainer: React.FC<React.PropsWithChildren> = ({
  children = null,
}) => (
  <FilePreviewContainerWrapper direction="column" gap={12}>
    {children}
  </FilePreviewContainerWrapper>
);

interface ActivityReportDetailFrameProps {
  profile: Profile;
  isOperatingCommittee?: boolean;
  operatingCommitteeSecret?: string;
}

const ActivityReportDetailFrame: React.FC<ActivityReportDetailFrameProps> = ({
  profile,
  isOperatingCommittee = false,
  operatingCommitteeSecret = undefined,
}) => {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useGetActivityReportDetail(
    Number(id),
    operatingCommitteeSecret,
  );
  const {
    data: activityDeadline,
    isLoading: isLoadingDeadline,
    isError: isErrorDeadline,
  } = useGetActivityDeadline();
  const { mutate: deleteActivityReport } = useDeleteActivityReport();
  const { mutate: approveActivityReport } =
    useProfessorApproveSingleActivityReport();

  const isProgressVisible =
    profile.type === UserTypeEnum.Undergraduate ||
    profile.type === UserTypeEnum.Executive;

  const navigateToActivityReportList = () => {
    const profileType: UserTypeEnum = profile.type;
    switch (profileType) {
      case UserTypeEnum.Executive:
        router.back();
        break;
      case UserTypeEnum.Professor:
        router.push("/manage-club/");
        break;
      case UserTypeEnum.Master:
      case UserTypeEnum.Doctor:
      case UserTypeEnum.Employee:
      case UserTypeEnum.Undergraduate:
        router.push("/manage-club/activity-report");
        break;
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const exhaustiveCheck: never = profileType;
        router.push("/manage-club/activity-report");
      }
    }
  };

  const handleEdit = () => {
    router.push(`/manage-club/activity-report/${id}/edit`);
  };

  const handleDelete = useCallback(() => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          onConfirm={() => {
            deleteActivityReport(
              { requestParam: { activityId: Number(id) } },
              {
                onSuccess: () => {
                  close();
                  window.location.href = "/manage-club/activity-report";
                },
              },
            );
          }}
          onClose={close}
          confirmButtonText="삭제"
        >
          활동 보고서를 삭제하면 복구할 수 없습니다.
          <br />
          삭제하시겠습니까?
        </CancellableModalContent>
      </Modal>
    ));
  }, [deleteActivityReport, id]);

  const handleProfessorApproval = useCallback(() => {
    approveActivityReport(Number(id), {
      onSuccess: () => {
        overlay.open(({ isOpen, close }) => (
          <Modal isOpen={isOpen}>
            <ConfirmModalContent onConfirm={close}>
              활동 보고서 승인이 완료되었습니다.
            </ConfirmModalContent>
          </Modal>
        ));
      },
      onError: () => {
        overlay.open(({ isOpen, close }) => (
          <Modal isOpen={isOpen}>
            <ConfirmModalContent onConfirm={close}>
              활동 보고서 승인에 실패했습니다.
            </ConfirmModalContent>
          </Modal>
        ));
      },
    });
  }, [approveActivityReport, id]);

  const isPastActivityReport = useMemo(
    () =>
      data.durations?.every(duration => {
        if (!activityDeadline?.targetTerm || !duration.endTerm) return true;

        return (
          new Date(duration.endTerm) <=
          new Date(activityDeadline.targetTerm.startTerm)
        );
      }),
    [activityDeadline, data.durations],
  );

  if (isError) {
    return <NotFound />;
  }

  if (!data || isLoading) {
    return <AsyncBoundary isLoading={isLoading} isError={isError} />;
  }

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FlexWrapper direction="column" gap={40} style={{ alignSelf: "stretch" }}>
        <Card outline padding="32px" gap={20}>
          {(isProgressVisible || isOperatingCommittee) && (
            <ActivityReportStatusSection
              status={data.activityStatusEnumId}
              editedAt={data.editedAt}
              commentedAt={data.commentedAt ?? undefined}
              comments={data.comments.toReversed()}
            />
          )}

          <ActivitySection label="활동 정보">
            <List
              dataList={[
                `활동명: ${data.name}`,
                `활동 분류: ${getActivityTypeLabel(data.activityTypeEnumId)}`,
                "활동 기간:",
              ]}
              listType="bullet"
              gap={16}
            />

            <FlexWrapper
              direction="column"
              gap={12}
              style={{ paddingLeft: 24 }}
            >
              {data.durations.map((duration, index) => (
                <Typography key={index}>
                  {`${formatDate(duration.startTerm!)} ~ ${formatDate(duration.endTerm!)}`}
                </Typography>
              ))}
            </FlexWrapper>
            <List
              dataList={[
                `활동 장소: ${data.location}`,
                `활동 목적: ${data.purpose}`,
                `활동 내용: ${data.detail}`,
              ]}
              listType="bullet"
              gap={16}
            />
          </ActivitySection>
          <ActivitySection label={`활동 인원(${data.participants.length}명)`}>
            <List
              dataList={data.participants.map(
                participant =>
                  `${participant.studentNumber} ${participant.name}`,
              )}
              listType="bullet"
              gap={16}
              startIndex={0}
              fw="REGULAR"
              fs={16}
              lh={20}
            />
          </ActivitySection>
          <ActivitySection label="활동 증빙">
            <List
              dataList={[
                "첨부 파일",
                <FilePreviewContainer key="file-preview">
                  <ThumbnailPreviewList
                    fileList={data.evidenceFiles}
                    disabled
                  />
                </FilePreviewContainer>,
                `부가 설명: ${data.evidence}`,
              ]}
              listType="bullet"
              gap={16}
            />
          </ActivitySection>
          {data.professorApproval !== null && (
            <FlexWrapper
              direction="row"
              gap={16}
              justify="space-between"
              style={{
                alignItems: "center",
                alignSelf: "stretch",
                width: "100%",
              }}
            >
              <ActivitySection label="지도교수 승인" />
              <FlexWrapper
                direction="row"
                gap={8}
                style={{ alignItems: "center" }}
              >
                {data.professorApprovedAt && (
                  <Typography fs={14} lh={16} color="GRAY.300">
                    {formatDotDetailDate(data.professorApprovedAt)}
                  </Typography>
                )}
                <Tag
                  color={getProfessorApprovalTagColor(data.professorApproval)}
                >
                  {getProfessorApprovalLabel(data.professorApproval)}
                </Tag>
              </FlexWrapper>
            </FlexWrapper>
          )}
        </Card>

        {profile.type === UserTypeEnum.Executive &&
          !isOperatingCommittee &&
          activityDeadline?.canApprove && (
            <ExecutiveActivityReportApprovalSection
              comments={filterActivityComments(data.comments)}
              clubId={data.clubId}
            />
          )}

        {!isOperatingCommittee && (
          <FlexWrapper gap={20} justify="space-between">
            <Button type="default" onClick={navigateToActivityReportList}>
              목록으로 돌아가기
            </Button>

            <AsyncBoundary
              isLoading={isLoadingDeadline}
              isError={isErrorDeadline}
            >
              {profile.type === UserTypeEnum.Undergraduate &&
                activityDeadline?.isEditable &&
                !isPastActivityReport && (
                  <FlexWrapper gap={12}>
                    <Button type="default" onClick={handleDelete}>
                      삭제
                    </Button>
                    <Button type="default" onClick={handleEdit}>
                      수정
                    </Button>
                  </FlexWrapper>
                )}
              {profile.type === UserTypeEnum.Professor &&
                activityDeadline?.canApprove &&
                !isPastActivityReport && (
                  <Button
                    type={data.professorApprovedAt ? "disabled" : "default"}
                    onClick={handleProfessorApproval}
                  >
                    승인
                  </Button>
                )}
            </AsyncBoundary>
          </FlexWrapper>
        )}
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ActivityReportDetailFrame;
