import { Request as _Request } from "express";

interface User {
  id: number;
  sid: string;
  name: string;
  email: string;
  studentId?: number;
  studentNumber?: number;
  executiveId?: number;
  ssoSid: string; // 개발 모드에서 sso logout을 위해서 추가
}

export interface UserRefreshTokenPayload {
  user: Pick<User, "id" | "sid" | "name" | "email" | "ssoSid">;
}

export interface UserAccessTokenPayload {
  user: User;
}

export type Request = _Request & RequestExtra;
export interface RequestExtra {
  session: {
    next: string;
    ssoState: string;
  };
}
