import { Request as _Request } from "express";

import { SsoLoginDiagnostic } from "../util/sso-login-diagnostic";

interface User {
  id: number;
  sid: string;
  name: string;
  email: string;
  studentId?: number;
  studentNumber?: number;
  executiveId?: number;
  exchangeActor?: ExchangeLoginActor;
}

export interface ExchangeLoginActor {
  id: number;
  email: string | null;
}

export interface UserRefreshTokenPayload {
  user: Pick<User, "id" | "sid" | "name" | "email" | "exchangeActor">;
}

export interface UserAccessTokenPayload {
  user: User;
}

export type Request = _Request & RequestExtra;
export interface RequestExtra {
  ssoLoginDiagnostic?: SsoLoginDiagnostic;
  session: {
    next: string;
    ssoState: string;
  };
}
