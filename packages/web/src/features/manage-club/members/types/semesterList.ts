import React from "react";

import { Semester } from "@sparcs-clubs/web/types/semester";

export type SemesterProps = Pick<Semester, "id" | "year" | "name">;

export interface SemesterListProps {
  semesters: SemesterProps[];
  selectedSemesters: SemesterProps[];
  setSelectedSemesters: React.Dispatch<React.SetStateAction<SemesterProps[]>>;
}
