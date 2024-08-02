import { useState } from "react";

import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import Select from "@sparcs-clubs/web/common/components/Select";
import Typography from "@sparcs-clubs/web/common/components/Typography";
import ChangeDivisionPresident from "@sparcs-clubs/web/features/manage-devision/components/ChangeDivisionPresident";

const ChangeDivisionPresidentCard = () => {
  const hasChangeNotice = true;
  const isSelectDisabled = true;

  const mockPresidentCandidateList = [
    "20210227 박병찬",
    "20200510 이지윤",
    "20240503 이민욱",
  ];

  const [mockPresident, setMockPresident] = useState<string>(
    mockPresidentCandidateList[0],
  );

  return (
    <Card outline padding="32px" gap={32} style={{ flex: 1 }}>
      <Typography ff="PRETENDARD" fw="MEDIUM" fs={20} lh={24}>
        분과 학생회장
      </Typography>
      {hasChangeNotice ? (
        <ChangeDivisionPresident
          status="Requested"
          actingPresident
          change={["20210227 박병찬", "20200510 이지윤"]}
        />
      ) : null}
      <FlexWrapper gap={4} direction="column">
        <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={24}>
          학생회장
        </Typography>
        <Select
          items={mockPresidentCandidateList.map((item, _) => ({
            value: item,
            label: item,
          }))}
          selectedValue={mockPresident}
          onSelect={setMockPresident}
          disabled={isSelectDisabled}
        />
      </FlexWrapper>
    </Card>
  );
};

export default ChangeDivisionPresidentCard;
