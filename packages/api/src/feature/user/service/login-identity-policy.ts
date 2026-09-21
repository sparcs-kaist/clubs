export const getStudentNumberSuffix = (studentNumber: string | number) =>
  Number(studentNumber.toString().slice(-4));

export function isHpStudentNumber(studentNumber: string | number): boolean {
  const suffix = getStudentNumberSuffix(studentNumber);
  const atLeastHpStart = suffix >= 6900;
  const beforeHpEnd = suffix < 7000;
  const isHp = atLeastHpStart && beforeHpEnd;
  return isHp;
}

export function isStudentIdentity(type: string, typeV2: string): boolean {
  const studentV2 = typeV2 === "S";
  const studentV1 = type === "Student";
  const formerEmployeeV1 = type === "Ex-employee";
  const professorV2 = typeV2.startsWith("P");
  const isStudent =
    studentV2 || ((studentV1 || formerEmployeeV1) && !professorV2);
  return isStudent;
}

export function isProfessorIdentity(type: string, typeV2: string): boolean {
  const facultyV2 = typeV2 === "F";
  const teacherV1 = type.includes("Teacher");
  const professorV2 = typeV2.startsWith("P");
  const isProfessor = facultyV2 || teacherV1 || professorV2;
  return isProfessor;
}

export function isEmployeeIdentity(type: string, typeV2: string): boolean {
  const employeeV2 = typeV2 === "E";
  const researcherV2 = typeV2 === "R";
  const employeeV1 = type === "Employee";
  const isEmployee = employeeV2 || researcherV2 || employeeV1;
  return isEmployee;
}

export function parseIdentityDepartment(department: string): number | null {
  if (!department) return null;
  const departmentId = parseInt(department);
  const invalidDepartment = Number.isNaN(departmentId);
  if (invalidDepartment) return null;
  return departmentId;
}
