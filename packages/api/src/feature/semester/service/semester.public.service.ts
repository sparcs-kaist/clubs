import { Injectable } from "@nestjs/common";

import SemesterRepository from "../repository/semester.repository";

@Injectable()
export class SemesterPublicService {
  constructor(private readonly semesterRepository: SemesterRepository) {}

  /**
   * @param RegistrationEventEnum의 배열의 객체
   * @returns void
   * @description 오늘 날짜가 enums배열에 존재하는 이벤트의 마감일에 속하는지 확인합니다.
   */
}
