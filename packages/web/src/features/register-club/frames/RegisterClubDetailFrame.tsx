import React from "react";
import styled from "styled-components";

import { ApiReg011ResponseOk } from "@sparcs-clubs/interface/api/registration/endpoint/apiReg011";
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
import { isProvisional } from "@sparcs-clubs/web/features/register-club/utils/registrationType";
import {
  getActualMonth,
  getActualYear,
} from "@sparcs-clubs/web/utils/Date/extractDate";
import { getTagDetail } from "@sparcs-clubs/web/utils/getTagDetail";
import { professorEnumToText } from "@sparcs-clubs/web/utils/getUserType";

interface ClubRegisterDetail {
  profile: UserTypeEnum | "permanent";
  clubDetail: ApiReg011ResponseOk;
}

const FilePreviewContainerWrapper = styled(FlexWrapper)`
  padding-left: 24px;
  align-self: stretch;
`;

export const FilePreviewContainer: React.FC<React.PropsWithChildren> = ({
  children = null,
}) => (
  <FilePreviewContainerWrapper direction="column" gap={12}>
    {children}
  </FilePreviewContainerWrapper>
);

const RegisterClubDetailFrame: React.FC<ClubRegisterDetail> = ({
  profile,
  clubDetail,
}: ClubRegisterDetail) => {
  const {
    data: divisionData,
    isLoading: divisionLoading,
    isError: divisionError,
  } = useGetDivisionType();

  return (
    <AsyncBoundary isLoading={divisionLoading} isError={divisionError}>
      <Card padding="32px" gap={20} outline>
        {/* 교수: progress 보여주지 않음. 상임동아리: progress는 보이나 comments 가림 */}
        {profile !== UserTypeEnum.Professor && (
          <RegisterClubStatusSection
            status={clubDetail.registrationStatusEnumId}
            editedAt={clubDetail.updatedAt}
            comments={profile !== "permanent" ? clubDetail.comments : []}
          />
        )}
        <FlexWrapper gap={20} direction="row">
          <Typography fw="MEDIUM" lh={20} fs={16} style={{ flex: 1 }}>
            등록 구분
          </Typography>
          <Tag
            color={
              getTagDetail(
                clubDetail.registrationTypeEnumId,
                RegistrationTypeTagList,
              ).color
            }
          >
            {
              getTagDetail(
                clubDetail.registrationTypeEnumId,
                RegistrationTypeTagList,
              ).text
            }
          </Tag>
        </FlexWrapper>
        <FlexWrapper gap={16} direction="column">
          <Typography fw="MEDIUM" lh={20} fs={16}>
            기본 정보
          </Typography>
          <FlexWrapper gap={12} direction="column">
            <ListItem>
              동아리명 (국문):{" "}
              {clubDetail.clubNameKr ?? clubDetail.newClubNameKr}
            </ListItem>
            <ListItem>
              동아리명 (영문):{" "}
              {clubDetail.clubNameEn ?? clubDetail.newClubNameEn}
            </ListItem>
            {clubDetail.clubNameKr && clubDetail.newClubNameKr !== "" && (
              <ListItem>
                신규 동아리명 (국문): {clubDetail.newClubNameKr}
              </ListItem>
            )}
            {clubDetail.clubNameEn && clubDetail.newClubNameEn !== "" && (
              <ListItem>
                신규 동아리명 (영문): {clubDetail.newClubNameEn}
              </ListItem>
            )}
            <ListItem>{`대표자 이름: ${clubDetail.representative.name}`}</ListItem>
            <ListItem>
              {`대표자 전화번호: ${clubDetail.representative.phoneNumber}`}
            </ListItem>
            {isProvisional(clubDetail.registrationTypeEnumId) ? (
              <ListItem>
                설립 연월: {getActualYear(clubDetail.foundedAt)}년{" "}
                {getActualMonth(clubDetail.foundedAt)}월
              </ListItem>
            ) : (
              <ListItem>
                설립 연도: {getActualYear(clubDetail.foundedAt)}
              </ListItem>
            )}
            <ListItem>
              {`소속 분과: ${clubDetail && divisionData?.divisionTagList[clubDetail.divisionId]?.text}`}
            </ListItem>
            <ListItem>{`활동 분야 (국문): ${clubDetail.activityFieldKr}`}</ListItem>
            <ListItem>{`활동 분야 (영문): ${clubDetail.activityFieldEn}`}</ListItem>
          </FlexWrapper>
        </FlexWrapper>
        {clubDetail.professor && (
          <FlexWrapper gap={16} direction="column">
            <Typography fw="MEDIUM" lh={20} fs={16}>
              지도교수 정보
            </Typography>
            <FlexWrapper gap={12} direction="column">
              <ListItem>{`성함: ${clubDetail.professor?.name}`}</ListItem>
              <ListItem>
                {`직급: ${professorEnumToText(clubDetail.professor?.professorEnumId)}`}
              </ListItem>
              <ListItem>{`이메일: ${clubDetail.professor?.email}`}</ListItem>
            </FlexWrapper>
          </FlexWrapper>
        )}
        <FlexWrapper gap={16} direction="column">
          <Typography fw="MEDIUM" lh={20} fs={16}>
            동아리 정보
          </Typography>
          <FlexWrapper gap={12} direction="column">
            <ListItem>분과 정합성:</ListItem>
            <IndentedItem>{clubDetail.divisionConsistency}</IndentedItem>
            <ListItem>설립 목적:</ListItem>
            <IndentedItem>{clubDetail.foundationPurpose}</IndentedItem>
            <ListItem>주요 활동 계획:</ListItem>
            <IndentedItem>{clubDetail.activityPlan}</IndentedItem>
            {clubDetail.activityPlanFile && (
              <>
                <ListItem>활동계획서</ListItem>
                {clubDetail.activityPlanFile && (
                  <FilePreviewContainer>
                    <ThumbnailPreviewList
                      fileList={[clubDetail.activityPlanFile]}
                      disabled
                    />
                  </FilePreviewContainer>
                )}
              </>
            )}
          </FlexWrapper>
          {clubDetail.clubRuleFile && (
            <>
              <ListItem>동아리 회칙</ListItem>
              {clubDetail.clubRuleFile && (
                <FilePreviewContainer>
                  <ThumbnailPreviewList
                    fileList={[clubDetail.clubRuleFile]}
                    disabled
                  />
                </FilePreviewContainer>
              )}
            </>
          )}
          {clubDetail.externalInstructionFile && (
            <>
              <ListItem>(선택) 외부 강사 지도 계획서</ListItem>
              {clubDetail.externalInstructionFile && (
                <FilePreviewContainer>
                  <ThumbnailPreviewList
                    fileList={[clubDetail.externalInstructionFile]}
                    disabled
                  />
                </FilePreviewContainer>
              )}
            </>
          )}
        </FlexWrapper>
        {clubDetail.registrationTypeEnumId ===
          RegistrationTypeEnum.Promotional &&
          clubDetail.clubId && (
            <MyRegisterClubActFrame
              profile={profile}
              clubId={clubDetail.clubId}
            />
          )}
        {clubDetail.professor && (
          <FlexWrapper gap={20} direction="row">
            <Typography fw="MEDIUM" lh={20} fs={16} style={{ flex: 1 }}>
              지도교수 승인
            </Typography>
            <Tag
              color={
                clubDetail &&
                ProfessorIsApprovedTagList(clubDetail.isProfessorSigned).color
              }
            >
              {clubDetail &&
                ProfessorIsApprovedTagList(clubDetail.isProfessorSigned).text}
            </Tag>
          </FlexWrapper>
        )}
      </Card>
    </AsyncBoundary>
  );
};

export default RegisterClubDetailFrame;
