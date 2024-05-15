import Button from "@sparcs-clubs/web/common/components/Button";
import Icon from "@sparcs-clubs/web/common/components/Icon";
import colors from "@sparcs-clubs/web/styles/themes/colors";
import React, { useState } from "react";
import styled from "styled-components";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import MemberSearchAndFilter from "../components/MemberSearchAndFilter";
import AllMemberList from "../components/AllMemberList";
import { mockAllSemesters, mockSemesterMembers } from "./_mock/mockMembers";

const AllMemberWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const AllMemberListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding-left: 24px;
`;

const ExcelButton = styled(Button)`
  width: max-content;
  gap: 4px;
`;

const ExcelButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: flex-end;
`;

const AllMemberListFrame = () => {
  const [toggle, setToggle] = useState<boolean>(true);

  const [selectedSemesters, setSelectedSemesters] = useState<
    { id: number; year: number; name: string }[]
  >(mockAllSemesters.semesters);

  return (
    <AllMemberWrapper>
      <FoldableSectionTitle
        title="전체 회원 명단"
        toggle={toggle}
        toggleHandler={() => setToggle(!toggle)}
      />
      {toggle && (
        <AllMemberListWrapper>
          <ExcelButtonWrapper>
            <ExcelButton onClick={() => {}}>
              {/* TODO: 엑셀 다운로드 기능 구현 */}
              <Icon type="save_alt" size={16} color={colors.WHITE} />
              엑셀로 다운로드
            </ExcelButton>
          </ExcelButtonWrapper>
          <MemberSearchAndFilter
            semesters={mockAllSemesters.semesters}
            selectedSemesters={selectedSemesters}
            setSelectedSemesters={setSelectedSemesters}
          />
          {selectedSemesters
            .sort((a, b) => b.id - a.id) // 최신 학기부터 정렬(ID가 클수록 최신 학기라고 가정)
            .map(semester => (
              <AllMemberList
                key={semester.id}
                semester={`${semester.year}년 ${semester.name}학기`}
                members={mockSemesterMembers.members} // TODO: 지금은 학기 상관없이 다 똑같은 멤버 불러오고 있음. 실제 API 연결하면 수정해야함
              />
            ))}
        </AllMemberListWrapper>
      )}
    </AllMemberWrapper>
  );
};

export default AllMemberListFrame;
