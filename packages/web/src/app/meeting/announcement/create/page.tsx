"use client";

import React, { useState } from "react";

import { ApiMee001RequestBody } from "@sparcs-clubs/interface/api/meeting/apiMee001";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import styled from "styled-components";

import Button from "@sparcs-clubs/web/common/components/Button";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import PageHead from "@sparcs-clubs/web/common/components/PageHead";

import MeetingAnnouncementFrame from "@sparcs-clubs/web/features/meeting/components/MeetingAnnouncementFrame";
import MeetingInformationFrame from "@sparcs-clubs/web/features/meeting/components/MeetingInformationFrame";

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const CreateMeetingPage: React.FC = () => {
  const router = useRouter();
  const formCtx = useForm<ApiMee001RequestBody>({
    mode: "all",
  });

  const {
    resetField,
    // getValues,
    handleSubmit,
    formState: { isValid },
  } = formCtx;

  const [isTemplateVisible, setIsTemplateVisible] = useState(false);

  const submitHandler = () => {
    // TODO. api 연결

    // console.log("values: ", getValues());
    router.replace("/meeting");
  };

  return (
    <FormProvider {...formCtx}>
      <form onSubmit={handleSubmit(submitHandler)}>
        <FlexWrapper direction="column" gap={60}>
          <PageHead
            items={[
              {
                name: `의결기구`,
                path: `/meeting`,
              },
              {
                name: `공고 작성`,
                path: `/meeting/announcement/create`,
              },
            ]}
            title="공고 작성"
          />
          <MeetingInformationFrame
            onCreateTemplate={() => {
              setIsTemplateVisible(true);
            }}
          />
          <MeetingAnnouncementFrame
            isTemplateVisible={isTemplateVisible}
            onReset={defaultValue => {
              resetField("announcementContent", { defaultValue });
            }}
          />
          <ButtonWrapper>
            <Link href="/meeting">
              <Button type="outlined">취소</Button>
            </Link>
            <Button buttonType="submit" type={isValid ? "default" : "disabled"}>
              저장
            </Button>
          </ButtonWrapper>
        </FlexWrapper>
      </form>
    </FormProvider>
  );
};

export default CreateMeetingPage;
