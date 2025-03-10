import { useRouter } from "next/navigation";
import React from "react";
import { useFormContext } from "react-hook-form";
import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import Info from "@sparcs-clubs/web/common/components/Info";
import { errorHandler } from "@sparcs-clubs/web/common/components/Modal/ErrorModal";
import StyledBottom from "@sparcs-clubs/web/common/components/StyledBottom";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import usePostActivityCertificate from "@sparcs-clubs/web/features/activity-certificate/services/usePostActivityCertificate";
import { ActivityCertificateInfo } from "@sparcs-clubs/web/features/activity-certificate/types/activityCertificate";
import { formatActivityDuration } from "@sparcs-clubs/web/features/activity-certificate/utils/formatActivityDuration";
import { useGetClubDetail } from "@sparcs-clubs/web/features/clubs/services/useGetClubDetail";
import { formatMonth } from "@sparcs-clubs/web/utils/Date/formatDate";

interface ActivityCertificateInfoThirdFrameProps {
  onPrev: VoidFunction;
}

const ActivityCertificateThirdFrameInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  align-self: stretch;
`;

const BasicInfoSummaryFrameInner = styled.div`
  align-self: stretch;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
  display: flex;
`;

const ActivityDescriptionSummaryFrameInner = styled.div`
  width: 100%;
  height: 100%;
  padding-left: 24px;
  padding-right: 24px;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 12px;
  display: inline-flex;
`;

const ActivityDescriptionSummaryRow = styled.div`
  align-self: stretch;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 12px;
  display: inline-flex;
`;

const ActivityCertificateInfoThirdFrame: React.FC<
  ActivityCertificateInfoThirdFrameProps
> = ({ onPrev }) => {
  const router = useRouter();

  const {
    getValues,
    formState: { isValid },
  } = useFormContext<ActivityCertificateInfo>();

  const {
    data: clubData,
    isLoading,
    isError,
  } = useGetClubDetail(getValues().clubId.toString());

  const { mutate, isPending } = usePostActivityCertificate();

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <ActivityCertificateThirdFrameInner>
        <Card outline gap={20}>
          <BasicInfoSummaryFrameInner>
            <Typography
              key="orderUserInfo"
              fs={16}
              lh={20}
              fw="MEDIUM"
              style={{ whiteSpace: "pre-wrap" }}
            >
              신청자 정보
            </Typography>
            <Typography
              key="orderUserName"
              fs={16}
              lh={20}
              fw="REGULAR"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {`  •  이름: ${getValues().applicantName}`}
            </Typography>
            <Typography
              key="orderUserDepartment"
              fs={16}
              lh={20}
              fw="REGULAR"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {`  •  학과: ${getValues().applicantDepartment}`}
            </Typography>
            <Typography
              key="orderUserStudentNumber"
              fs={16}
              lh={20}
              fw="REGULAR"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {`  •  학번: ${getValues().applicantStudentNumber}`}
            </Typography>
            <Typography
              key="orderUserPhoneNumber"
              fs={16}
              lh={20}
              fw="REGULAR"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {`  •  연락처: ${getValues().applicantPhoneNumber}`}
            </Typography>
            <Typography
              key="orderInfo"
              fs={16}
              lh={20}
              fw="MEDIUM"
              style={{ whiteSpace: "pre-wrap" }}
            >
              활동확인서 발급 신청 정보
            </Typography>
            <Typography
              key="orderInfoClub"
              fs={16}
              lh={20}
              fw="REGULAR"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {`  •  동아리: ${clubData?.nameKr}`}{" "}
            </Typography>
            <Typography
              key="orderInfoDuration"
              fs={16}
              lh={20}
              fw="REGULAR"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {`  •  활동 기간: ${formatActivityDuration(getValues().activityDuration)}`}
            </Typography>
            <Typography
              key="orderInfoIssueCount"
              fs={16}
              lh={20}
              fw="REGULAR"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {`  •  발급 매수: ${getValues().issuedNumber!}매`}
            </Typography>
            <Typography
              key="orderInfoText"
              fs={16}
              lh={20}
              fw="REGULAR"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {`  •  활동 내역`}
            </Typography>
            <ActivityDescriptionSummaryFrameInner>
              {getValues().histories.map((activityDescription, index) => {
                const startMonth = activityDescription.dateRange?.[0];
                const endMonth = activityDescription.dateRange?.[1];

                return (
                  <ActivityDescriptionSummaryRow
                    key={`activityDescription_${index}`}
                  >
                    {startMonth?.getMonth() === endMonth?.getMonth() ? (
                      <Typography
                        key={`${index}_start`}
                        fs={16}
                        lh={20}
                        fw="REGULAR"
                        style={{
                          whiteSpace: "pre-wrap",
                          width: "200px",
                          textAlign: "center",
                        }}
                      >
                        {formatMonth(startMonth!)}
                      </Typography>
                    ) : (
                      <Typography
                        key={`${index}_end`}
                        fs={16}
                        lh={20}
                        fw="REGULAR"
                        style={{
                          whiteSpace: "pre-wrap",
                          width: "200px",
                          textAlign: "center",
                        }}
                      >
                        {formatMonth(startMonth!)} ~{formatMonth(endMonth!)}
                      </Typography>
                    )}

                    <Typography
                      key={`${index}_description`}
                      fs={16}
                      lh={20}
                      fw="REGULAR"
                      style={{
                        whiteSpace: "pre-wrap",
                        flex: "1 1 0",
                      }}
                    >
                      {activityDescription.description}
                    </Typography>
                  </ActivityDescriptionSummaryRow>
                );
              })}
            </ActivityDescriptionSummaryFrameInner>
          </BasicInfoSummaryFrameInner>
        </Card>
        <Info text="활동확인서 발급이 완료되면 이메일 또는 문자를 통해 (방법은 동연에서 정해주세요) 연락이 갈 것이라는 안내 문구" />
      </ActivityCertificateThirdFrameInner>
      <StyledBottom>
        <Button onClick={onPrev}>이전</Button>
        <Button
          onClick={() => {
            mutate(
              {
                body: {
                  clubId: getValues().clubId,
                  issuedNumber: getValues().issuedNumber,
                  studentPhoneNumber:
                    getValues().applicantPhoneNumber.toString(),
                  items: getValues().histories.map(value => ({
                    startMonth: value.dateRange[0]!,
                    endMonth: value.dateRange[1]!,
                    detail: value.description,
                  })),
                },
              },
              {
                onSuccess: () => {
                  router.replace("/");
                },
                onError: () => errorHandler("생성에 실패하였습니다"),
              },
            );
          }}
          type={isValid && !isPending ? "default" : "disabled"}
        >
          신청
        </Button>
      </StyledBottom>
    </AsyncBoundary>
  );
};

export default ActivityCertificateInfoThirdFrame;
