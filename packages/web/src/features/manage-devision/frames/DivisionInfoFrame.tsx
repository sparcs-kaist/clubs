import { useState } from "react";

import styled from "styled-components";

import Button from "@sparcs-clubs/web/common/components/Button";
import Card from "@sparcs-clubs/web/common/components/Card";
import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import Icon from "@sparcs-clubs/web/common/components/Icon";
import Tag from "@sparcs-clubs/web/common/components/Tag";
import Typography from "@sparcs-clubs/web/common/components/Typography";

const ClubListWrapper = styled(FlexWrapper)`
  max-height: 300px;
  overflow-y: scroll;
`;

const DivisionInfoFrame: React.FC = () => {
  const [showClubList, setShowClubList] = useState<boolean>(false);
  const mockClubList = Array.from({ length: 20 }).map((_, i) => ({
    name: "술박스",
    id: i,
  }));

  return (
    <FlexWrapper gap={40} direction="column">
      <FoldableSectionTitle title="분과 정보">
        <FlexWrapper gap={20} direction="row">
          <Card outline padding="32px" style={{ flex: 1 }}>
            <FlexWrapper gap={32} direction="column">
              <Typography ff="PRETENDARD" fw="MEDIUM" fs={20} lh={24}>
                기본 정보
              </Typography>
              <FlexWrapper gap={20} direction="row">
                <Typography
                  ff="PRETENDARD"
                  fw="MEDIUM"
                  fs={16}
                  lh={20}
                  style={{ flex: 1 }}
                >
                  분과명
                </Typography>
                <Tag color="PURPLE">생활 체육</Tag>
              </FlexWrapper>
              <FlexWrapper
                gap={8}
                direction="row"
                onClick={() => setShowClubList(!showClubList)}
              >
                {showClubList ? (
                  <Icon type="keyboard_arrow_down" size={20} />
                ) : (
                  <Icon type="keyboard_arrow_right" size={20} />
                )}
                <FlexWrapper gap={16} direction="column" style={{ flex: 1 }}>
                  <Typography ff="PRETENDARD" fw="MEDIUM" fs={16} lh={20}>
                    {`동아리 목록 (${mockClubList.length}개)`}
                  </Typography>
                  {showClubList ? (
                    <ClubListWrapper direction="column" gap={12}>
                      {mockClubList.map((club, _) => (
                        <Typography
                          ff="PRETENDARD"
                          fw="REGULAR"
                          fs={16}
                          lh={20}
                          key={club.id}
                        >
                          {club.name}
                        </Typography>
                      ))}
                    </ClubListWrapper>
                  ) : null}
                </FlexWrapper>
              </FlexWrapper>
              <Button type="disabled" style={{ marginLeft: "auto" }}>
                저장
              </Button>
            </FlexWrapper>
          </Card>
          <Card outline padding="32px" style={{ flex: 1 }} />
        </FlexWrapper>
      </FoldableSectionTitle>
    </FlexWrapper>
  );
};

export default DivisionInfoFrame;
