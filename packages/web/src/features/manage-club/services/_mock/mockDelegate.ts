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
      studentId: 20200000,
      studentNumber: 20200000,
      studentName: "이도라",
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
    },
    {
      id: 20200511,
      studentNumber: "20200511",
      name: "박지호",
      phoneNumber: "010-1234-5678",
    },
    {
      id: 20200512,
      studentNumber: "20200512",
      name: "박병찬",
      phoneNumber: "010-1234-5678",
    },
    {
      id: 20200513,
      studentNumber: "20200513",
      name: "이도라",
      phoneNumber: "010-1234-5678",
    },
    {
      id: 20200514,
      studentNumber: "20200514",
      name: "삼도라",
      phoneNumber: "010-1234-5678",
    },
    {
      id: 20200515,
      studentNumber: "20200515",
      name: "사도라",
      phoneNumber: "010-1234-5678",
    },
  ],
};
