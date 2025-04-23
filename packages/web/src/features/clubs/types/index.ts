import { ApiClb001ResponseOK } from "@clubs/interface/api/club/endpoint/apiClb001";

export type ClubDetail =
  ApiClb001ResponseOK["divisions"][number]["clubs"][number];
