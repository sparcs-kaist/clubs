import React from "react";

import { RegistrationTypeEnum } from "@sparcs-clubs/interface/common/enum/registration.enum";
import { UserTypeEnum } from "@sparcs-clubs/interface/common/enum/user.enum";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Card from "@sparcs-clubs/web/common/components/Card";
import ThumbnailPreviewList from "@sparcs-clubs/web/common/components/File/ThumbnailPreviewList";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import {
  IndentedItem,
  ListItem,
} from "@sparcs-clubs/web/common/components/ListItem";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import useGetDivisionType from "@sparcs-clubs/web/common/hooks/useGetDivisionType";
import {
  ProfessorIsApprovedTagList,
  RegistrationTypeTagList,
} from "@sparcs-clubs/web/constants/tableTagList";
import RegisterClubStatusSection from "@sparcs-clubs/web/features/executive/register-club/components/RegisterClubStatusSection";
import MyRegisterClubActFrame from "@sparcs-clubs/web/features/my/register-club/frames/MyRegisterClubActFrame";
import { FilePreviewContainer } from "@sparcs-clubs/web/features/my/register-club/frames/MyRegisterClubDetailFrame";
import useRegisterClubDetail from "@sparcs-clubs/web/features/register-club/services/useGetRegisterClubDetail";
import { isProvisional } from "@sparcs-clubs/web/features/register-club/utils/registrationType";
import {
  getActualMonth,
  getActualYear,
} from "@sparcs-clubs/web/utils/Date/extractDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";
import { professorEnumToText } from "@sparcs-clubs/web/utils/getUserType";

export interface ClubRegisterDetail {
  applyId: number;
  profile: UserTypeEnum;
}

const RegisterClubDetailFrame: React.FC<ClubRegisterDetail> = ({
  applyId,
  profile,
}: ClubRegisterDetail) => {
  const { data, isLoading, isError } = useRegisterClubDetail(profile, {
    applyId: +applyId,
  });

  const {
    data: divisionData,
    isLoading: divisionLoading,
    isError: divisionError,
  } = useGetDivisionType();

  return (
    <AsyncBoundary
      isLoading={isLoading || divisionLoading}
      isError={isError || divisionError}
    >
      <Card padding="32px" gap={20} outline>
        {data && (
          <RegisterClubStatusSection
            status={data.registrationStatusEnumId}
            editedAt={data.updatedAt}
            comments={data.comments}
          />
        )}
        <FlexWrapper gap={20} direction="row">
          <Typography fw="MEDIUM" lh={20} fs={16} style={{ flex: 1 }}>
            등록 구분
          </Typography>
          <Tag
            color={
              data &&
              getTagDetail(data.registrationTypeEnumId, RegistrationTypeTagList)
                .color
            }
          >
            {data &&
              getTagDetail(data.registrationTypeEnumId, RegistrationTypeTagList)
                .text}
          </Tag>
        </FlexWrapper>
        <FlexWrapper gap={16} direction="column">
          <Typography fw="MEDIUM" lh={20} fs={16}>
            기본 정보
          </Typography>
          <FlexWrapper gap={12} direction="column">
            <ListItem>
              동아리명 (국문): {data?.clubNameKr ?? data?.newClubNameKr}
            </ListItem>
            <ListItem>
              동아리명 (영문): {data?.clubNameEn ?? data?.newClubNameEn}
            </ListItem>
            {data?.clubNameKr && data?.newClubNameKr !== "" && (
              <ListItem>신규 동아리명 (국문): {data?.newClubNameKr}</ListItem>
            )}
            {data?.clubNameEn && data?.newClubNameEn !== "" && (
              <ListItem>신규 동아리명 (영문): {data?.newClubNameEn}</ListItem>
            )}
            <ListItem>{`대표자 이름: ${data?.representative.name}`}</ListItem>
            <ListItem>
              {`대표자 전화번호: ${data?.representative.phoneNumber}`}
            </ListItem>
            {data &&
              (isProvisional(data.registrationTypeEnumId) ? (
                <ListItem>
                  설립 연월: {getActualYear(data.foundedAt)}년{" "}
                  {getActualMonth(data.foundedAt)}월
                </ListItem>
              ) : (
                <ListItem>설립 연도: {getActualYear(data.foundedAt)}</ListItem>
              ))}
            <ListItem>
              {`소속 분과: ${data && divisionData?.divisionTagList[data?.divisionId]?.text}`}
            </ListItem>
            <ListItem>{`활동 분야 (국문): ${data?.activityFieldKr}`}</ListItem>
            <ListItem>{`활동 분야 (영문): ${data?.activityFieldEn}`}</ListItem>
          </FlexWrapper>
        </FlexWrapper>
        {data?.professor && (
          <FlexWrapper gap={16} direction="column">
            <Typography fw="MEDIUM" lh={20} fs={16}>
              지도교수 정보
            </Typography>
            <FlexWrapper gap={12} direction="column">
              <ListItem>{`성함: ${data?.professor?.name}`}</ListItem>
              <ListItem>
                {`직급: ${professorEnumToText(data?.professor?.professorEnumId)}`}
              </ListItem>
              <ListItem>{`이메일: ${data?.professor?.email}`}</ListItem>
            </FlexWrapper>
          </FlexWrapper>
        )}
        <FlexWrapper gap={16} direction="column">
          <Typography fw="MEDIUM" lh={20} fs={16}>
            동아리 정보
          </Typography>
          <FlexWrapper gap={12} direction="column">
            <ListItem>분과 정합성:</ListItem>
            <IndentedItem>{data?.divisionConsistency}</IndentedItem>
            <ListItem>설립 목적:</ListItem>
            <IndentedItem>{data?.foundationPurpose}</IndentedItem>
            <ListItem>주요 활동 계획:</ListItem>
            <IndentedItem>{data?.activityPlan}</IndentedItem>
            {data?.activityPlanFile && (
              <>
                <ListItem>활동계획서</ListItem>
                {data?.activityPlanFile && (
                  <FilePreviewContainer>
                    <ThumbnailPreviewList
                      fileList={[data.activityPlanFile]}
                      disabled
                    />
                  </FilePreviewContainer>
                )}
              </>
            )}
          </FlexWrapper>
          {data?.clubRuleFile && (
            <>
              <ListItem>동아리 회칙</ListItem>
              {data?.clubRuleFile && (
                <FilePreviewContainer>
                  <ThumbnailPreviewList
                    fileList={[data.clubRuleFile]}
                    disabled
                  />
                </FilePreviewContainer>
              )}
            </>
          )}
          {data?.externalInstructionFile && (
            <>
              <ListItem>(선택) 외부 강사 지도 계획서</ListItem>
              {data?.externalInstructionFile && (
                <FilePreviewContainer>
                  <ThumbnailPreviewList
                    fileList={[data.externalInstructionFile]}
                    disabled
                  />
                </FilePreviewContainer>
              )}
            </>
          )}
        </FlexWrapper>
        {data &&
          data.registrationTypeEnumId === RegistrationTypeEnum.Promotional &&
          data.clubId && (
            <MyRegisterClubActFrame profile={profile} clubId={data.clubId} />
          )}
        {data?.professor && (
          <FlexWrapper gap={20} direction="row">
            <Typography fw="MEDIUM" lh={20} fs={16} style={{ flex: 1 }}>
              지도교수 승인
            </Typography>
            <Tag
              color={
                data &&
                ProfessorIsApprovedTagList(data?.isProfessorSigned).color
              }
            >
              {data && ProfessorIsApprovedTagList(data?.isProfessorSigned).text}
            </Tag>
          </FlexWrapper>
        )}
      </Card>
    </AsyncBoundary>
  );
};

export default RegisterClubDetailFrame;
