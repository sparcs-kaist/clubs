import React from "react";

import { ApiSem001ResponseOK } from "@clubs/interface/api/semester/apiSem001";
import { ApiSem019ResponseOk } from "@clubs/interface/api/semester/apiSem019";

import FoldableSection from "@sparcs-clubs/web/common/components/FoldableSection";

import RegistrationDeadlineTable from "./RegistrationDeadlineTable";

interface RegistrationDeadlineSectionProps {
  semester: ApiSem001ResponseOK["semesters"][number];
  deadlines: ApiSem019ResponseOk["deadlines"];
}

const RegistrationDeadlineSection: React.FC<
  RegistrationDeadlineSectionProps
> = ({ semester, deadlines }) => (
  <FoldableSection
    key={semester.id}
    title={`${semester.year}년 ${semester.name}`}
    childrenMargin="20px"
  >
    <RegistrationDeadlineTable deadlines={deadlines} />
  </FoldableSection>
);

export default RegistrationDeadlineSection;
