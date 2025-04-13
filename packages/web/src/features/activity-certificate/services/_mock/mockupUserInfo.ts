/*

아래 코드는 ApiAcf001이 유저 데이터(학번, 동아리 목록 등)를 가져오는 api인줄 알고 잘못 만든 코드입니다
TODO - 유저 데이터를 가져오는 api가 나오면 그걸 기반으로 아래 코드 정상적으로 바꿔주기

*/

import type { ApiAcf001ResponseCreated } from "@clubs/interface/api/activity-certificate/endpoint/apiAcf001";

const mockupUserInfo: ApiAcf001ResponseCreated = {
  studentNumber: 20239999,
  krPhoneNumber: "01012345678",
  department: "Department of Computing",
  issuedNumber: 1234, // 이건 무슨 넘버죠?
  items: [
    {
      clubId: 46,
      startMonth: new Date("2022-01-01"),
      endMonth: new Date("2022-05-05"),
      detail: "Mola",
    },
    {
      clubId: 71,
      startMonth: new Date("2023-01-01"),
      endMonth: new Date("2023-02-02"),
      detail: "Mola",
    },
  ],
};

export default mockupUserInfo;
