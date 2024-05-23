import BreadCrumb from "@sparcs-clubs/web/common/components/BreadCrumb";
import Card from "@sparcs-clubs/web/common/components/Card";
import Button from "@sparcs-clubs/web/common/components/Button";
import FileUpload from "@sparcs-clubs/web/common/components/FileUpload";
// import DateRangeInput from "@sparcs-clubs/web/common/components/Forms/DateRangeInput";
import Select from "@sparcs-clubs/web/common/components/Forms/Select";
import TextInput from "@sparcs-clubs/web/common/components/Forms/TextInput";
import PageTitle from "@sparcs-clubs/web/common/components/PageTitle";
import SectionTitle from "@sparcs-clubs/web/common/components/SectionTitle";
import React from "react";
import styled from "styled-components";
import SelectParticipant from "../components/SelectParticipant";
import { mockParticipantData } from "../_mock/mock";

const ActivityReportMainFrameInner = styled.div`
  color: ${({ theme }) => theme.colors.BLACK};
`;

const PageTitleOuter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  align-self: stretch;
`;

const SectionInner = styled.div`
  padding-left: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  align-self: stretch;
`;

const HorizontalPlacer = styled.div`
  display: flex;
  gap: 32px;
`;

const ButtonPlaceRight = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  align-self: stretch;
`;

const ActivityReportCreateFrame: React.FC = () => (
  <ActivityReportMainFrameInner>
    <PageTitleOuter>
      <BreadCrumb
        items={[
          { name: "대표 동아리 관리", path: "/manage-club" },
          { name: "활동 보고서", path: "/activity-report" },
        ]}
      />
      <PageTitle>활동 보고서 작성</PageTitle>
      <SectionTitle>활동 정보</SectionTitle>
      <SectionInner>
        <Card outline padding="32px" gap={32}>
          <TextInput label="활동명" placeholder="활동명을 입력해주세요" />
          <HorizontalPlacer>
            <Select
              label="활동 분류"
              items={[
                {
                  value: "internal",
                  label: "동아리 성격에 합치하는 내부 활동",
                  selectable: true,
                },
                {
                  value: "external",
                  label: "동아리 성격에 합치하는 외부 활동",
                  selectable: true,
                },
                {
                  value: "none",
                  label: "동아리 성격에 합치하지 않는 활동",
                  selectable: true,
                },
              ]}
            />
            {/* <DateRangeInput label="활동 기간" /> */}
          </HorizontalPlacer>
          <TextInput label="활동 장소" placeholder="활동 장소를 입력해주세요" />
          <TextInput label="활동 목적" placeholder="활동 목적을 입력해주세요" />
          <TextInput
            area
            label="활동 내용"
            placeholder="활동 내용을 입력해주세요"
          />
        </Card>
      </SectionInner>
      <SectionTitle>활동 인원</SectionTitle>
      <SectionInner>
        <SelectParticipant data={mockParticipantData} />
      </SectionInner>
      <SectionTitle>활동 증빙</SectionTitle>
      <SectionInner>
        <Card outline padding="32px" gap={32}>
          <FileUpload placeholder="파일을 선택해주세요" />
          <TextInput
            area
            placeholder="(선택) 활동 증빙에 대해서 작성하고 싶은 것이 있다면 입력해주세요"
          />
        </Card>
      </SectionInner>
      <ButtonPlaceRight>
        <Button type="default">저장</Button>
      </ButtonPlaceRight>
    </PageTitleOuter>
  </ActivityReportMainFrameInner>
);

export default ActivityReportCreateFrame;
