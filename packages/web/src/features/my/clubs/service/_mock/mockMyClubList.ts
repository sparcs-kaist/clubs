import type { ApiClb003ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb003";

// mockup model to interface
const mockMyClubList: ApiClb003ResponseOK = {
  semesters: [
    {
      id: 15,
      name: "2024 봄",
      clubs: [
        {
          id: 42,
          nameKr: "KAINATION",
          nameEn: "KAINATION",
          type: 2,
          isPermanent: false,
          characteristic: "기부",
          representative: "강현우",
          advisor: "신병하",
          totalMemberCnt: 5,
        },
      ],
    },
    {
      id: 14,
      name: "2023 가을",
      clubs: [
        {
          id: 42,
          nameKr: "KAINATION",
          nameEn: "KAINATION",
          type: 1,
          isPermanent: false,
          characteristic: "기부",
          representative: "강현우",
          advisor: "신병하",
          totalMemberCnt: 5,
        },
      ],
    },
    {
      id: 13,
      name: "2023 봄",
      clubs: [
        {
          id: 34,
          nameKr: "MUSE",
          nameEn: "MUSE",
          type: 2,
          isPermanent: false,
          characteristic: "밴드세션&코러스",
          representative: "정민호",
          advisor: "이해신",
          totalMemberCnt: 27,
        },
        {
          id: 42,
          nameKr: "KAINATION",
          nameEn: "KAINATION",
          type: 1,
          isPermanent: false,
          characteristic: "기부",
          representative: "강현우",
          advisor: "신병하",
          totalMemberCnt: 5,
        },
      ],
    },
  ],
};

export default mockMyClubList;
