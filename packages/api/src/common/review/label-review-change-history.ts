import { ReviewChangeHistory } from "@clubs/interface/api/review/type/review-change-history.type";

const fileFields = new Set([
  "evidenceFiles",
  "tradeEvidenceFiles",
  "tradeDetailFiles",
  "imageFiles",
  "softwareEvidenceFiles",
  "files",
]);
const studentFields = new Set(["participants", "passengers"]);

type SnapshotObject = Record<string, unknown>;
type Reference<Id> = { id: Id; fields: SnapshotObject };

export async function labelReviewChangeHistory(
  history: ReviewChangeHistory,
  resolve: {
    files: (ids: string[]) => Promise<Map<string, string>>;
    students: (
      ids: number[],
    ) => Promise<Map<number, { name: string; studentNumber?: string }>>;
    activities?: (ids: number[]) => Promise<Map<number, string>>;
  },
): Promise<ReviewChangeHistory> {
  const files: Reference<string>[] = [];
  const students: Reference<number>[] = [];
  const activities: Reference<number>[] = [];
  const visit = (field: string, value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(item => visit(field, item));
      return;
    }
    if (value === null) return;
    if (typeof value !== "object") return;

    const fields = value as SnapshotObject;
    const { id } = fields;
    if (fileFields.has(field)) {
      if (typeof id === "string") files.push({ id, fields });
    } else if (studentFields.has(field)) {
      if (typeof id === "number") students.push({ id, fields });
    } else if (field === "purposeActivity") {
      if (typeof id === "number") activities.push({ id, fields });
    } else {
      Object.entries(fields).forEach(([key, child]) => visit(key, child));
    }
  };
  history.forEach(({ before, after }) => {
    visit("", before);
    visit("", after);
  });

  const [fileNames, studentNames, activityNames] = await Promise.all([
    resolve.files([...new Set(files.map(file => file.id))]),
    resolve.students([...new Set(students.map(student => student.id))]),
    resolve.activities?.([...new Set(activities.map(activity => activity.id))]),
  ]);
  files.forEach(({ id, fields }) => {
    Object.assign(fields, { name: fileNames.get(id) });
  });
  students.forEach(({ id, fields }) => {
    const student = studentNames.get(id);
    Object.assign(fields, {
      name: student?.name,
      studentNumber: student?.studentNumber,
    });
  });
  activities.forEach(({ id, fields }) => {
    Object.assign(fields, { name: activityNames?.get(id) });
  });
  return history;
}
