import React from "react";

import FlexWrapper from "@sparcs-clubs/web/common/components/FlexWrapper";
import FoldableSectionTitle from "@sparcs-clubs/web/common/components/FoldableSectionTitle";
import ProfessorActivityReportTable from "@sparcs-clubs/web/features/activity-report/components/professor/ProfessorActivityReportTable";

interface ClubActivitySectionProps {
  clubId: number;
}

const ClubActivitySection: React.FC<ClubActivitySectionProps> = ({
  clubId,
}) => (
  <FoldableSectionTitle title="동아리 활동">
    <FlexWrapper direction="column" gap={20}>
      <ProfessorActivityReportTable clubId={clubId} />
      {/* TODO: 지원금 테이블 추가 */}
    </FlexWrapper>
  </FoldableSectionTitle>
);

export default ClubActivitySection;
