import { Request as _Request, Response as _Response } from "express";

export type Request = _Request & RequestExtra;

export interface RequestExtra {
  session: {
    next: string;
    sso_state: string;
  };
}

export interface Response extends _Response {}

export interface JwtPayload {
  sid: string;
}
