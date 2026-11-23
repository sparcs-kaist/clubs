import { ApiClb006ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb006";
import { ApiClb008ResponseOk } from "@clubs/interface/api/club/endpoint/apiClb008";
import { ApiClb011ResponseOk } from "@clubs/interface/api/club/index";
import {
  ClubDelegateChangeRequestStatusEnum,
  ClubDelegateEnum,
} from "@clubs/interface/common/enum/club.enum";

export const mockClubDelegates: ApiClb006ResponseOK = {
  delegates: [
    {
      delegateEnumId: ClubDelegateEnum.Representative,
      studentId: 20200510,
      studentNumber: 20200510,
      name: "이지윤",
      phoneNumber: "010-1234-5678",
    },
    {
      delegateEnumId: ClubDelegateEnum.Delegate1,
      studentId: 20200511,
      studentNumber: 20200511,
      name: "박지호",
      phoneNumber: "010-1234-5678",
    },
    {
      delegateEnumId: ClubDelegateEnum.Delegate2,
      studentId: 20200512,
      studentNumber: 20200512,
      name: "박병찬",
      phoneNumber: "010-1234-5678",
    },
  ],
};

export const mockClubDelegateRequest: ApiClb011ResponseOk = {
  requests: [
    {
      id: 1,
      delegateEnumId: ClubDelegateEnum.Delegate1,
      studentId: 20200000,
      studentNumber: 20200000,
      studentName: "이도라",
      isCanceled: false,
      clubDelegateChangeRequestStatusEnumId:
        ClubDelegateChangeRequestStatusEnum.Applied,
    },
  ],
};

export const mockClubDelegateCandidates: ApiClb008ResponseOk = {
  students: [
    {
      id: 20200510,
      studentNumber: "20200510",
      name: "이지윤",
      phoneNumber: "010-1234-5678",
      currentRoles: [
        {
          clubId: 1,
          clubName: "술박스",
          delegateEnumId: ClubDelegateEnum.Representative,
        },
      ],
    },
    {
      id: 20200511,
      studentNumber: "20200511",
      name: "박지호",
      phoneNumber: "010-1234-5678",
      currentRoles: [
        {
          clubId: 1,
          clubName: "술박스",
          delegateEnumId: ClubDelegateEnum.Delegate1,
        },
      ],
    },
    {
      id: 20200512,
      studentNumber: "20200512",
      name: "박병찬",
      phoneNumber: "010-1234-5678",
      currentRoles: [
        {
          clubId: 1,
          clubName: "술박스",
          delegateEnumId: ClubDelegateEnum.Delegate2,
        },
      ],
    },
    {
      id: 20200513,
      studentNumber: "20200513",
      name: "이도라",
      phoneNumber: "010-1234-5678",
      currentRoles: [
        {
          clubId: 2,
          clubName: "여로",
          delegateEnumId: ClubDelegateEnum.Delegate1,
        },
      ],
    },
    {
      id: 20200514,
      studentNumber: "20200514",
      name: "삼도라",
      phoneNumber: "010-1234-5678",
      currentRoles: [
        {
          clubId: 3,
          clubName: "Khartes",
          delegateEnumId: ClubDelegateEnum.Representative,
        },
      ],
    },
    {
      id: 20200515,
      studentNumber: "20200515",
      name: "사도라",
      phoneNumber: "010-1234-5678",
      currentRoles: [],
    },
  ],
};
