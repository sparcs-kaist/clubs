import React from "react";
import { useFormContext } from "react-hook-form";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import Card from "@sparcs-clubs/web/common/components/Card";
import { FileDetail } from "@sparcs-clubs/web/common/components/File/attachment";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FormController from "@sparcs-clubs/web/common/components/FormController";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import { advancedInfoFileUploadContent } from "@sparcs-clubs/web/features/register-club/constants";
import { RegisterClubModel } from "@sparcs-clubs/web/features/register-club/types/registerClub";

import SingleUploadWithTextAndTemplate from "./SingleUploadWithTextAndTemplate";

interface AdvancedInformFrameProps {
  type: RegistrationTypeEnum;
  files?: {
    activityPlanFile?: FileDetail;
    clubRuleFile?: FileDetail;
    externalInstructionFile?: FileDetail;
  };
}

const AdvancedInformFrame: React.FC<AdvancedInformFrameProps> = ({
  type,
  files = undefined,
}) => {
  const formCtx = useFormContext<RegisterClubModel>();
  const { control } = formCtx;

  return (
    <FlexWrapper direction="column" gap={40}>
      <SectionTitle>동아리 신청 정보</SectionTitle>
      <Card outline gap={32} style={{ marginLeft: 20 }}>
        <FormController
          name="divisionConsistency"
          required
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              label="분과 정합성"
              placeholder="분과 정합성을 입력해주세요"
              area
            />
          )}
        />
        <FormController
          name="foundationPurpose"
          required
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              label="설립 목적"
              placeholder="설립 목적을 입력해주세요"
              area
            />
          )}
        />
        <FormController
          name="activityPlan"
          required
          control={control}
          renderItem={props => (
            <TextInput
              {...props}
              label="주요 활동 계획"
              placeholder="주요 활동 계획을 입력해주세요"
              style={{ height: 200 }}
              area
            />
          )}
        />

        {type !== RegistrationTypeEnum.Renewal && (
          <SingleUploadWithTextAndTemplate
            fileId="activityPlanFile"
            {...advancedInfoFileUploadContent.activityPlanFile}
            initialFile={files?.activityPlanFile}
          />
        )}
        {type === RegistrationTypeEnum.Promotional && (
          <SingleUploadWithTextAndTemplate
            fileId="clubRuleFile"
            {...advancedInfoFileUploadContent.clubRuleFile}
            initialFile={files?.clubRuleFile}
          />
        )}
        <SingleUploadWithTextAndTemplate
          fileId="externalInstructionFile"
          {...advancedInfoFileUploadContent.externalInstructionFile}
          initialFile={files?.externalInstructionFile}
        />
      </Card>
    </FlexWrapper>
  );
};

export default AdvancedInformFrame;
