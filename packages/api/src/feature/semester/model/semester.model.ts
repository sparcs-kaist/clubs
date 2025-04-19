import { ISemester } from "@clubs/domain/semester/semester";

import { MEntity } from "@sparcs-clubs/api/common/base/entity.model";

/**
 * @description Semester 모델
 * @description 항상 모든 날짜에 대해 하나의 Semester가 존재합니다.
 * @description 최상위 기본단위입니다.
 * @description 현재 구현상 학기 추가 시 학기 추가 전 학기의 끝날짜와 새로 추가되는 학기의 시작날짜가 같아야 합니다.
 */

export class MSemester extends MEntity<ISemester> implements ISemester {
  static modelName = "Semester";

  name: ISemester["name"];

  startTerm: ISemester["startTerm"];

  endTerm: ISemester["endTerm"];

  year: ISemester["year"];

  constructor(data: ISemester) {
    super(data);
  }
}
