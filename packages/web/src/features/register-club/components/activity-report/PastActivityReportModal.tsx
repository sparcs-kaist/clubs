import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { overlay } from "overlay-kit";
import React, { useEffect, useState } from "react";

import { ActivityStatusEnum } from "@clubs/domain/activity/activity";

import apiAct011 from "@clubs/interface/api/activity/endpoint/apiAct011";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import ThumbnailPreviewList from "@sparcs-clubs/web/common/components/File/ThumbnailPreviewList";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Icon from "@sparcs-clubs/web/common/components/Icon";
import { ListItem } from "@sparcs-clubs/web/common/components/ListItem";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import ConfirmModalContent from "@sparcs-clubs/web/common/components/Modal/ConfirmModalContent";
import CommentToast from "@sparcs-clubs/web/common/components/Toast/CommentToast";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useExecutiveApproveActivityReport from "@sparcs-clubs/web/features/activity-report/hooks/useExecutiveApproveActivityReport";
import useExecutiveRejectActivityReport from "@sparcs-clubs/web/features/activity-report/hooks/useExecutiveRejectActivityReport";
import { useDeleteActivityReportProvisional } from "@sparcs-clubs/web/features/activity-report/services/useDeleteActivityReportProvisional";
import {
  activityReportDetailQueryKey,
  useGetActivityReport,
} from "@sparcs-clubs/web/features/activity-report/services/useGetActivityReport";

import EditActivityReportModal from "./EditActivityReportModal";

interface PastActivityReportModalProps {
  activityId: number;
  profile: string;
  isOpen: boolean;
  close: VoidFunction;
  viewOnly?: boolean;
  clubId: number;
}

const PastActivityReportModal: React.FC<PastActivityReportModalProps> = ({
  activityId,
  profile,
  isOpen,
  close,
  viewOnly = false,
  clubId,
}) => {
  const t = useTranslations("my.registration.activity");
  const format = useFormatter();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useGetActivityReport(
    profile,
    activityId,
  );
  const {
    mutate: deleteActivityReport,
    isSuccess: isDeleteSuccess,
    isError: isDeleteError,
  } = useDeleteActivityReportProvisional();

  const isExecutive = profile === UserTypeEnum.Executive;

  const [rejectionDetail, setRejectionDetail] = useState("");

  const handleDelete = () => {
    deleteActivityReport(
      { requestParam: { activityId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: activityReportDetailQueryKey(profile, activityId),
            exact: false,
          });
          queryClient.invalidateQueries({ queryKey: [apiAct011.url()] });
          close();
        },
      },
    );
  };

  const handleEdit = () => {
    overlay.open(
      ({ isOpen: isOpenEditActivityModal, close: closeEditActivityModal }) => (
        <EditActivityReportModal
          profile={profile}
          activityId={activityId}
          isOpen={isOpenEditActivityModal}
          close={() => {
            closeEditActivityModal();
            refetch();
          }}
        />
      ),
    );
  };

  useEffect(() => {
    if (isDeleteSuccess) {
      overlay.open(
        ({
          isOpen: isOpenDeleteSuccessModal,
          close: closeDeleteSuccessModal,
        }) => (
          <Modal isOpen={isOpenDeleteSuccessModal}>
            <ConfirmModalContent onConfirm={closeDeleteSuccessModal}>
              {t("deleted")}
            </ConfirmModalContent>
          </Modal>
        ),
      );
      return;
    }
    if (isDeleteError) {
      overlay.open(
        ({ isOpen: isOpenDeleteErrorModal, close: closeDeleteErrorModal }) => (
          <Modal isOpen={isOpenDeleteErrorModal}>
            <ConfirmModalContent onConfirm={closeDeleteErrorModal}>
              {t("deleteError")}
            </ConfirmModalContent>
          </Modal>
        ),
      );
    }
  }, [isDeleteSuccess, isDeleteError, t]);

  const { mutate: patchActivityExecutive } = useExecutiveApproveActivityReport(
    activityId,
    clubId,
  );
  const { mutate: patchActivityExecutiveSendBack } =
    useExecutiveRejectActivityReport(activityId, clubId);
  const handleApprove = async () => {
    await patchActivityExecutive();
    close();
  };

  const handleReject = async () => {
    await patchActivityExecutiveSendBack(rejectionDetail);
    setRejectionDetail("");
    refetch();
    close();
  };

  const handleOpenActivityReportPage = () => {
    close();
    router.push(`/manage-club/activity-report/${activityId}`);
  };

  const handleCopyActivityReportUrl = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/manage-club/activity-report/${activityId}`,
      );
      overlay.open(({ isOpen: isOpenCopyModal, close: closeCopyModal }) => (
        <Modal isOpen={isOpenCopyModal}>
          <ConfirmModalContent onConfirm={closeCopyModal}>
            {t("urlCopied")}
          </ConfirmModalContent>
        </Modal>
      ));
    } catch {
      overlay.open(({ isOpen: isOpenCopyModal, close: closeCopyModal }) => (
        <Modal isOpen={isOpenCopyModal}>
          <ConfirmModalContent onConfirm={closeCopyModal}>
            {t("urlCopyError")}
          </ConfirmModalContent>
        </Modal>
      ));
    }
  };

  if (!data) return null;

  return (
    <Modal isOpen={isOpen} width="full">
      <AsyncBoundary isLoading={isLoading} isError={isError}>
        <FlexWrapper style={{ height: 0, margin: 0, zIndex: 10 }}>
          <FlexWrapper
            direction="row"
            gap={16}
            style={{
              position: "absolute",
              right: 0,
            }}
          >
            <Button
              style={{ padding: "8px" }}
              onClick={handleCopyActivityReportUrl}
              aria-label={t("copyUrl")}
            >
              <Icon type="link_variant" size={16} color="white" />
            </Button>
            <Button
              style={{ padding: "8px" }}
              onClick={handleOpenActivityReportPage}
              aria-label={t("openPage")}
            >
              <Icon type="open_in_new" size={16} color="white" />
            </Button>
          </FlexWrapper>
        </FlexWrapper>
        <FlexWrapper gap={20} direction="column">
          {!isExecutive &&
            data.activityStatusEnumId === ActivityStatusEnum.Rejected &&
            data.comments.length > 0 && (
              <CommentToast
                title={t("rejectionReason")}
                reasons={data.comments.map(comment => ({
                  id: comment.id,
                  datetime: comment.createdAt,
                  reason: comment.content,
                }))}
                color="red"
              />
            )}

          <FlexWrapper gap={16} direction="column">
            <Typography fw="MEDIUM" fs={16} lh={20}>
              {t("information")}
            </Typography>
            <FlexWrapper gap={12} direction="column">
              <ListItem>
                {t("fieldValue", { label: t("name"), value: data.name })}
              </ListItem>
              <ListItem>
                {t("fieldValue", {
                  label: t("type"),
                  value: t(`types.${data.activityTypeEnumId}`),
                })}
              </ListItem>
              <ListItem>
                {t("fieldValue", { label: t("period"), value: "" })}
              </ListItem>
              <FlexWrapper
                direction="column"
                gap={12}
                style={{ paddingLeft: 24 }}
              >
                {data.durations.map((duration, index) => (
                  <Typography key={index}>
                    {`${format.dateTime(new Date(duration.startTerm), { year: "numeric", month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" })} ~ ${format.dateTime(new Date(duration.endTerm), { year: "numeric", month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" })}`}
                  </Typography>
                ))}
              </FlexWrapper>
              <ListItem>
                {t("fieldValue", {
                  label: t("location"),
                  value: data.location,
                })}
              </ListItem>
              <ListItem>
                {t("fieldValue", { label: t("purpose"), value: data.purpose })}
              </ListItem>
              <ListItem>
                {t("fieldValue", { label: t("detail"), value: data.detail })}
              </ListItem>
            </FlexWrapper>
          </FlexWrapper>
          <FlexWrapper gap={16} direction="column">
            <Typography fw="MEDIUM" fs={16} lh={20}>
              {t("participantCount", { count: data.participants.length ?? 0 })}
            </Typography>

            {data.participants.map(participant => (
              <ListItem key={participant.studentId}>
                {participant.studentNumber} {participant.name}
              </ListItem>
            ))}
          </FlexWrapper>
          <FlexWrapper gap={16} direction="column">
            <Typography fw="MEDIUM" fs={16} lh={20}>
              {t("evidence")}
            </Typography>
            <FlexWrapper gap={12} direction="column">
              <ListItem>
                {t("attachmentCount", {
                  count: data.evidenceFiles.length ?? 0,
                })}
              </ListItem>
              {data.evidenceFiles.length > 0 && (
                <FlexWrapper
                  direction="column"
                  gap={0}
                  style={{ paddingLeft: 16 }}
                >
                  <ThumbnailPreviewList
                    fileList={data.evidenceFiles.map(_file => ({
                      id: _file.fileId,
                      name: _file.name,
                      url: _file.url,
                    }))}
                    disabled
                  />
                </FlexWrapper>
              )}
              <ListItem>
                {t("fieldValue", {
                  label: t("additionalDescription"),
                  value: data.evidence ?? "",
                })}
              </ListItem>
            </FlexWrapper>
          </FlexWrapper>
          {isExecutive && (
            <>
              {data.comments.length > 0 && (
                <FlexWrapper direction="column" gap={8}>
                  {data.comments.map((comment, index) => (
                    <FlexWrapper
                      direction="column"
                      gap={4}
                      key={`${index.toString()}`}
                    >
                      <Typography fs={14} lh={16} color="GRAY.600">
                        {format.dateTime(new Date(comment.createdAt), {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hourCycle: "h23",
                          timeZone: "Asia/Seoul",
                        })}
                      </Typography>
                      <Typography fs={16} lh={24}>
                        {comment.content}
                      </Typography>
                    </FlexWrapper>
                  ))}
                </FlexWrapper>
              )}
              <FlexWrapper gap={16} direction="column">
                <Typography fw="MEDIUM" fs={16} lh={20}>
                  {t("rejectionInputLabel")}
                </Typography>
                <TextInput
                  value={rejectionDetail}
                  handleChange={setRejectionDetail}
                  placeholder={t("contentPlaceholder")}
                  area
                />
              </FlexWrapper>
            </>
          )}
          {!isExecutive && viewOnly ? (
            <FlexWrapper direction="row" gap={12}>
              <Button type="outlined" onClick={close}>
                {t("close")}
              </Button>
            </FlexWrapper>
          ) : (
            <FlexWrapper
              direction="row"
              gap={12}
              style={{
                flex: 1,
                alignItems: "flex-end",
                justifyContent: "space-between",
              }}
            >
              <Button type="outlined" onClick={close}>
                {t("cancel")}
              </Button>
              <FlexWrapper direction="row" gap={12}>
                <Button onClick={isExecutive ? handleApprove : handleDelete}>
                  {isExecutive ? t("approve") : t("delete")}
                </Button>
                {/* TODO: 반려 연결 */}
                <Button
                  onClick={isExecutive ? handleReject : handleEdit}
                  type={
                    isExecutive && rejectionDetail === ""
                      ? "disabled"
                      : "default"
                  }
                >
                  {isExecutive ? t("reject") : t("edit")}
                </Button>
              </FlexWrapper>
            </FlexWrapper>
          )}
        </FlexWrapper>
      </AsyncBoundary>
    </Modal>
  );
};

export default PastActivityReportModal;
