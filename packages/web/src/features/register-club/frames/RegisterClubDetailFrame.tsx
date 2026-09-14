import { useTranslations } from "next-intl";
import React from "react";
import styled from "styled-components";

import { ApiReg011ResponseOk } from "@clubs/interface/api/registration/endpoint/apiReg011";
import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

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
  const t = useTranslations("my.registration");
  const divisionT = useTranslations("division");
  const {
    data: divisionData,
    isLoading: divisionLoading,
    isError: divisionError,
  } = useGetDivisionType();
  const divisionName =
    divisionData?.divisionTagList[clubDetail.divisionId]?.text;

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
            {t("registrationType")}
          </Typography>
          <Tag
            color={
              getTagDetail(
                clubDetail.registrationTypeEnumId,
                RegistrationTypeTagList,
              ).color
            }
          >
            {t(`types.${clubDetail.registrationTypeEnumId}`)}
          </Tag>
        </FlexWrapper>
        <FlexWrapper gap={16} direction="column">
          <Typography fw="MEDIUM" lh={20} fs={16}>
            {t("basicInfo")}
          </Typography>
          <FlexWrapper gap={12} direction="column">
            <ListItem>
              {t("clubNameKr")}:{" "}
              {clubDetail.clubNameKr ?? clubDetail.newClubNameKr}
            </ListItem>
            <ListItem>
              {t("clubNameEn")}:{" "}
              {clubDetail.clubNameEn ?? clubDetail.newClubNameEn}
            </ListItem>
            {clubDetail.clubNameKr && clubDetail.newClubNameKr !== "" && (
              <ListItem>
                {t("newClubNameKr")}: {clubDetail.newClubNameKr}
              </ListItem>
            )}
            {clubDetail.clubNameEn && clubDetail.newClubNameEn !== "" && (
              <ListItem>
                {t("newClubNameEn")}: {clubDetail.newClubNameEn}
              </ListItem>
            )}
            <ListItem>
              {t("representativeName")}: {clubDetail.representative.name}
            </ListItem>
            <ListItem>
              {t("representativePhone")}:{" "}
              {clubDetail.representative.phoneNumber}
            </ListItem>
            {isProvisional(clubDetail.registrationTypeEnumId) ? (
              <ListItem>
                {t("foundedYearMonth", {
                  year: getActualYear(clubDetail.foundedAt),
                  month: getActualMonth(clubDetail.foundedAt),
                })}
              </ListItem>
            ) : (
              <ListItem>
                {t("foundedYear")}: {getActualYear(clubDetail.foundedAt)}
              </ListItem>
            )}
            <ListItem>
              {t("division")}:{" "}
              {divisionName &&
                (divisionT.has(divisionName)
                  ? divisionT(divisionName)
                  : divisionName)}
            </ListItem>
            <ListItem>
              {t("activityFieldKr")}: {clubDetail.activityFieldKr}
            </ListItem>
            <ListItem>
              {t("activityFieldEn")}: {clubDetail.activityFieldEn}
            </ListItem>
          </FlexWrapper>
        </FlexWrapper>
        {clubDetail.professor && (
          <FlexWrapper gap={16} direction="column">
            <Typography fw="MEDIUM" lh={20} fs={16}>
              {t("professorInfo")}
            </Typography>
            <FlexWrapper gap={12} direction="column">
              <ListItem>
                {t("name")}: {clubDetail.professor?.name}
              </ListItem>
              <ListItem>
                {t("rank")}:{" "}
                {t(
                  `professorRanks.${professorEnumToText(clubDetail.professor?.professorEnumId)}`,
                )}
              </ListItem>
              <ListItem>
                {t("email")}: {clubDetail.professor?.email}
              </ListItem>
            </FlexWrapper>
          </FlexWrapper>
        )}
        <FlexWrapper gap={16} direction="column">
          <Typography fw="MEDIUM" lh={20} fs={16}>
            {t("clubInfo")}
          </Typography>
          <FlexWrapper gap={12} direction="column">
            <ListItem>{t("divisionConsistency")}:</ListItem>
            <IndentedItem>{clubDetail.divisionConsistency}</IndentedItem>
            <ListItem>{t("foundationPurpose")}:</ListItem>
            <IndentedItem>{clubDetail.foundationPurpose}</IndentedItem>
            <ListItem>{t("activityPlan")}:</ListItem>
            <IndentedItem>{clubDetail.activityPlan}</IndentedItem>
            {clubDetail.activityPlanFile && (
              <>
                <ListItem>{t("activityPlanFile")}</ListItem>
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
              <ListItem>{t("clubRulesFile")}</ListItem>
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
              <ListItem>{t("externalInstructionFile")}</ListItem>
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
              semesterId={clubDetail.semesterId}
            />
          )}
        {clubDetail.professor && (
          <FlexWrapper gap={20} direction="row">
            <Typography fw="MEDIUM" lh={20} fs={16} style={{ flex: 1 }}>
              {t("professorApproval")}
            </Typography>
            <Tag
              color={
                clubDetail &&
                ProfessorIsApprovedTagList(clubDetail.isProfessorSigned).color
              }
            >
              {t(
                clubDetail.isProfessorSigned
                  ? "approvalApproved"
                  : "approvalPending",
              )}
            </Tag>
          </FlexWrapper>
        )}
      </Card>
    </AsyncBoundary>
  );
};

export default RegisterClubDetailFrame;
