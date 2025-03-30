import { registry } from "@sparcs-clubs/interface/open-api";

export * from "./endpoint/apiReg005";
export { default as apiReg005 } from "./endpoint/apiReg005";
export * from "./endpoint/apiReg006";
export { default as apiReg006 } from "./endpoint/apiReg006";
export * from "./endpoint/apiReg007";
export { default as apiReg007 } from "./endpoint/apiReg007";
export * from "./endpoint/apiReg008";
export { default as apiReg008 } from "./endpoint/apiReg008";
export * from "./endpoint/apiReg013";
export { default as apiReg013 } from "./endpoint/apiReg013";
export * from "./endpoint/apiReg019";
export { default as apiReg019 } from "./endpoint/apiReg019";
export * from "./endpoint/apiReg020";
export { default as apiReg020 } from "./endpoint/apiReg020";
export * from "./endpoint/apiReg026";
export { default as apiReg026 } from "./endpoint/apiReg026";
export * from "./endpoint/apiReg028";
export { default as apiReg028 } from "./endpoint/apiReg028";

registry.registerPath({
  tags: ["member-registration"],
  method: "get",
  path: "/#/Registration",
  summary: "REG-???: 동아리 신청(Registration)에 관한 도메인 설명",
  description: `
  # REG-???: 동아리 신청(Registration)

  Registrationd은 매 학기 동아리 신청부터 회원 모집 마감까지의 일련의 동아리 신청 절차를 처리하기 위한 API입니다.
  동아리 신청은 크게 2개의 이벤트로 이루어져 있습니다.

  ## 1. 동아리 등록
  동아리 등록은 3가지 기간(RegistrationEventEnum)으로 이루어져 있습니다.

  ### 1-1. 동아리의 대표자가 동아리 등록을 신청하는 기간입니다.
  동아리 등록 신청은 4가지로 분류됩니다. 3가지 신청의 인수들은 REG-001을 통해 확인할 수 있습니다.
  - 정동아리 재등록 신청
  - 정동아리 신규등록 신청
  - 가동아리 재등록 신청
  - 가동아리 신규등록 신청

  **정동아리 신규등록의 경우 지난 활동(가동아리 기간동안의)들에 대한 활동보고서 작성이 필요합니다. 때문에 Activity 대분류의 일부 API를 이용해야 합니다.
  이 기간동안 학생들은 동아리 신청을 CRUD 할 수 있어야 합니다.**

  세부적인 신청권한의 경우 정책을 참고해주세요

  ### 1-2. 동아리 등록 신청들에 대해 집행부원이 검토하고 피드백하는 기간입니다.

  이 기간 동안 집행부원들은 동아리 등록 신청을 승인하거나, 피드백을 남길 수 있어야 합니다.

  이 기간 동안 신청자들은 등록 신청을 조회/삭제할 수 있어야 합니다.

  ### 1-3. 동아리 등록 신청들을 집행부원이 추가 검수하고, 코멘트에 대해 신청자(동아리 대표자)가 수정하는 기간입니다.

  이 기간 동안 집행부원들은 동아리 등록 신청을 승인하거나, 피드백을 남길 수 있어야 합니다.

  이 기간 동안 신청자들은 등록 신청을 조회/삭제하거나, 승인되지 않은 등록 신청을 수정할 수 있어야 합니다.

  동아리 등록 기간이 끝나면, 모든 신청은 삭제되며 신청이 승인된 동아리들은 이번학기 동아리 목록에 추가됩니다.

  동아리 등록 기간이 끝나고 회원 등록 기간이 시작되는 시점부터 동아리 회원 관리 관련 일부 기능(대의원, 대표자 변경)을 새로운 학기 기준으로 이용할 수 있습니다.

  디자인: 동아리 등록

  ## 2. 회원 등록

  동아리 등록 기간동안 등록된 동아리들은 각자의 방식으로 동아리원을 선발하고, 이를 Clubs에 등록합니다. 이를 회원 등록 기간(RegistrationEventEnum)에 처리합니다.

  회원 등록 기간동안 학생은 동아리 가입 신청을 생성할 수 있어야 합니다.

  회원 등록 기간동안 동아리 대표자 및 대의원은 동아리 가입 신청을 조회/승인/반려할 수 있어야 합니다.


  회원 등록 기간동안 승인된 동아리 가입 신청은 즉시 동아리 회원으로 반영됩니다.

  하지만 대표자 및 대의원은 승인된 신청을 반려로, 반려된 신청을 승인으로 변경할 수 있으며, 이때 동아리 회원 목록 또한 즉각적으로 반영되어야 합니다.

  단, 현재 동아리의 대표자 및 대의원인 학생은 지위를 다른 동아리원에게 넘기기 전까지 위 신청 결과 변경을 통해 회원 목록에서 제거할 수 없습니다.

  회원 등록 기간 종료시점에 회칙에 명시된 인원수를 충족하지 못한 동아리는 이번학기 동아리 목록에서 제거되어 동아리로서 서비스를 이용할 수 없습니다.

  디자인: 회원 등록

  이러한 기능을 구현하기 위해 Registrationd은 3가지 중분류로 이루어져 있습니다.

  - 일정(이벤트) 조회
  - 동아리 등록
  - 회원 등록
  `,
  responses: {},
});
