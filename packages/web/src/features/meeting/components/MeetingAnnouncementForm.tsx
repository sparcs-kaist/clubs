import { overlay } from "overlay-kit";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import styled from "styled-components";

import { MeetingEnum } from "@clubs/interface/common/enum/meeting.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import TextButton from "@sparcs-clubs/web/common/components/Buttons/TextButton";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import Modal from "@sparcs-clubs/web/common/components/Modal";
import CancellableModalContent from "@sparcs-clubs/web/common/components/Modal/CancellableModalContent";

import { MeetingTemplate } from "../constants/meetingTemplate";
import useGetMeetingDegree from "../services/useGetMeetingDegree";
import { MeetingAnnouncementModel } from "../types/meeting";

interface MeetingAnnouncementFormProps {
  isEditMode?: boolean;
}

const AlignEnd = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const MeetingAnnouncementForm: React.FC<MeetingAnnouncementFormProps> = ({
  isEditMode = false,
}) => {
  const formCtx = useFormContext<MeetingAnnouncementModel>();
  const { control, watch, resetField } = formCtx;

  const meetingEnumId = watch("meetingEnumId");
  const announcementContent = watch("announcementContent");

  const { data, isLoading, isError, refetch } = useGetMeetingDegree({
    meetingEnumId,
  });

  const openResetModal = () => {
    overlay.open(({ isOpen, close }) => (
      <Modal isOpen={isOpen}>
        <CancellableModalContent
          onConfirm={() => {
            resetField("announcementTitle");
            resetField("announcementContent");
            close();
          }}
          onClose={close}
        >
          공고 템플릿에 수정사항이 있을 경우 모두 초기화됩니다.
          <br />
          ㄱㅊ?
        </CancellableModalContent>
      </Modal>
    ));
  };

  useEffect(() => {
    if (isEditMode) return;

    if (meetingEnumId !== MeetingEnum.divisionMeeting && data?.degree != null) {
      const template = MeetingTemplate.defaultTemplate(
        meetingEnumId,
        data.degree,
      );

      resetField("announcementTitle", { defaultValue: template.title });
      resetField("announcementContent", { defaultValue: template.content });
    } else if (meetingEnumId === MeetingEnum.divisionMeeting) {
      const template = MeetingTemplate.divisionMeetingTemplate();

      resetField("announcementTitle", { defaultValue: template.title });
      resetField("announcementContent", { defaultValue: template.content });
    }
  }, [isEditMode, meetingEnumId, data, resetField]);

  useEffect(() => {
    if (meetingEnumId !== MeetingEnum.divisionMeeting) {
      refetch();
    }
  }, [meetingEnumId, refetch]);

  const contentLength = announcementContent?.split(/\r\n|\r|\n/).length;

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <FormController
        name="announcementTitle"
        required
        control={control}
        renderItem={props => (
          <TextInput {...props} label="제목" placeholder="" />
        )}
      />
      <FormController
        name="announcementContent"
        required
        control={control}
        renderItem={props => (
          <TextInput
            {...props}
            label="본문"
            placeholder=""
            area
            style={{
              height: contentLength ? contentLength * 25 : 100,
              whiteSpace: "pre-line",
            }}
          />
        )}
      />
      <AlignEnd>
        <TextButton text="초기화" onClick={openResetModal} />
      </AlignEnd>
    </AsyncBoundary>
  );
};

export default MeetingAnnouncementForm;
