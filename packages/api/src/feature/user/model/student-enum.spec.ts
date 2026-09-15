import { zStudentHistory as domainHistory } from "@clubs/domain/user/student";

import { zStudentHistory as interfaceHistory } from "@clubs/interface/api/user/type/user.type";

it.each([
  ["domain", domainHistory],
  ["interface", interfaceHistory],
] as const)(
  "validates academic degrees separately from attendance in %s",
  (_, schema) => {
    [1, 2, 3, 4, 5, 6, 7].forEach(degree => {
      expect(schema.shape.studentEnum.parse(degree)).toBe(degree);
    });
    [0, 8, "4", null].forEach(degree => {
      expect(schema.shape.studentEnum.safeParse(degree).success).toBe(false);
    });
    expect(schema.shape.StudentStatusEnum.parse(1)).toBe(1);
    expect(schema.shape.StudentStatusEnum.parse(2)).toBe(2);
    expect(schema.shape.StudentStatusEnum.safeParse(4).success).toBe(false);
  },
);
