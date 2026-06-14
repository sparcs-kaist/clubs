const MIN_OVERVIEW_YEAR = 2024;
const MIN_OVERVIEW_SEMESTER_NAME = "봄";
const SEMESTER_ORDER = ["봄", "여름", "가을", "겨울"];

interface OverviewSemesterLike {
  year: number;
  name: string;
}

function semesterOrder(name: string) {
  const order = SEMESTER_ORDER.indexOf(name);
  return order === -1 ? Number.MAX_SAFE_INTEGER : order;
}

export function isOverviewSelectableSemester(semester: OverviewSemesterLike) {
  if (semester.year > MIN_OVERVIEW_YEAR) {
    return true;
  }

  if (semester.year < MIN_OVERVIEW_YEAR) {
    return false;
  }

  return (
    semesterOrder(semester.name) >= semesterOrder(MIN_OVERVIEW_SEMESTER_NAME)
  );
}
