import styled from "styled-components";

import AsyncBoundary from "@sparcs-clubs/web/common/components/AsyncBoundary";
// import Button from "@sparcs-clubs/web/common/components/Button";
// import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
// import DateRangeInput from "@sparcs-clubs/web/common/components/Forms/DateRangeInput";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import Banner from "@sparcs-clubs/web/features/landing/components/Banner";

import DashboardButton from "../components/DashboardButton";
import OperationCommitteeSecretManager from "../components/SecretKey/OperationCommitteeSecretManager";
import ManageMemberFrame from "./ManageMemberFrame";
import ManageSemesterFrame from "./ManageSemesterFrame";

const DashboardSectionInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 24px;
  justify-content: flex-start;
`;

// const ButtonWrapper = styled.div`
//   display: flex;
//   justify-content: flex-end;
// `;

const ExecutiveDashboardFrame = () => {
  const isLoading = false;
  const isError = false;

  return (
    <AsyncBoundary isLoading={isLoading} isError={isError}>
      <Banner icon="warning">
        현재 집행부원 대시보드는 개발 중에 있습니다.
      </Banner>
      <ManageSemesterFrame />
      <ManageMemberFrame />
      <OperationCommitteeSecretManager />

      <FlexWrapper direction="column" gap={20}>
        <SectionTitle>기간 관리</SectionTitle>
        <DashboardSectionInner>
          <FlexWrapper
            direction="row"
            gap={60}
            style={{ justifyContent: "space-between" }}
          >
            <FlexWrapper direction="column" gap={12} style={{ flex: 1 }}>
              <DashboardButton text="동아리 등록 기간" link="" />
              <DashboardButton text="회원 등록 기간" link="" />
            </FlexWrapper>
            <FlexWrapper direction="column" gap={12} style={{ flex: 1 }}>
              <DashboardButton text="활동 보고서 기간" link="" />
              <DashboardButton
                text="지원금 기간"
                link="/executive/funding/deadline"
              />
            </FlexWrapper>
          </FlexWrapper>
        </DashboardSectionInner>
      </FlexWrapper>

      <FlexWrapper
        direction="row"
        gap={60}
        style={{ justifyContent: "space-between" }}
      >
        <FlexWrapper direction="column" gap={20} style={{ flex: 1 }}>
          <SectionTitle>동아리 / 회원 등록</SectionTitle>
          <DashboardSectionInner>
            <FlexWrapper direction="column" gap={12}>
              {/* TODO: 동아리 등록 기간 추가 */}
              {/* <Card outline>
                <DateRangeInput
                  label={["동아리 등록 기간", ""]}
                  startValue={""}
                  endValue={""}
                  limitStartValue={""}
                  limitEndValue={""}
                  onChange={() => {}}
                  placeholder={"20XX.XX.XX"}
                  isTextAlignCenter
                />
                <DateRangeInput
                  label={["회원 등록 기간", ""]}
                  startValue={""}
                  endValue={""}
                  limitStartValue={""}
                  limitEndValue={""}
                  onChange={() => {}}
                  placeholder={"20XX.XX.XX"}
                  isTextAlignCenter
                />
                <ButtonWrapper>
                  <Button type="disabled" onClick={() => {}}>
                    저장
                  </Button>
                </ButtonWrapper>
              </Card> */}
              <DashboardButton
                text="동아리 등록 신청 내역"
                link="/executive/register-club"
              />
              <DashboardButton
                text="회원 등록 신청 내역"
                link="/executive/register-member"
              />
            </FlexWrapper>
          </DashboardSectionInner>
        </FlexWrapper>
        <FlexWrapper direction="column" gap={20} style={{ flex: 1 }}>
          <SectionTitle>활동 보고서 / 지원금</SectionTitle>
          <DashboardSectionInner>
            {/* TODO: 활동 보고서 작성 기간 추가 */}
            {/* <Card outline>
              <DateRangeInput
                label={["활동 보고서 작성 기간", ""]}
                startValue={""}
                endValue={""}
                limitStartValue={""}
                limitEndValue={""}
                onChange={() => {}}
                placeholder={"20XX.XX.XX"}
                isTextAlignCenter
              />
              <DateRangeInput
                label={["활동 보고서 수정 기간", ""]}
                startValue={""}
                endValue={""}
                limitStartValue={""}
                limitEndValue={""}
                onChange={() => {}}
                placeholder={"20XX.XX.XX"}
                isTextAlignCenter
              />
              <DateRangeInput
                label={["활동 보고서 검토 기간", ""]}
                startValue={""}
                endValue={""}
                limitStartValue={""}
                limitEndValue={""}
                onChange={() => {}}
                placeholder={"20XX.XX.XX"}
                isTextAlignCenter
              />
              <Divider />
              <DateRangeInput
                label={["지원금 신청 기간", ""]}
                startValue={""}
                endValue={""}
                limitStartValue={""}
                limitEndValue={""}
                onChange={() => {}}
                placeholder={"20XX.XX.XX"}
                isTextAlignCenter
              />
              <ButtonWrapper>
                <Button type="disabled" onClick={() => {}}>
                  저장
                </Button>
              </ButtonWrapper>
            </Card> */}
            <FlexWrapper direction="column" gap={12}>
              <DashboardButton
                text="활동 보고서 작성 내역"
                link="/executive/activity-report"
              />
              <DashboardButton
                text="지원금 신청 내역"
                link=""
                // TODO: 지원금 신청 내역 링크 추가
              />
            </FlexWrapper>
          </DashboardSectionInner>
        </FlexWrapper>
      </FlexWrapper>
    </AsyncBoundary>
  );
};

export default ExecutiveDashboardFrame;
