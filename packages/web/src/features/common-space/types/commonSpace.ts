import React from "react";

import {
  ApiCms003RequestBody,
  ApiCms003RequestParam,
} from "@clubs/interface/api/common-space/endpoint/apiCms003";

export interface CommonSpaceBasicInfo {
  clubName: string;
  name: string;
  phoneNumber: string;
}

export interface CommonSpaceInterface extends CommonSpaceBasicInfo {
  agreement: boolean;
  body: Partial<ApiCms003RequestBody>;
  param: Partial<ApiCms003RequestParam>;
}

export interface CommonSpaceInfoProps {
  setAgreement: React.Dispatch<React.SetStateAction<boolean>>;
  body: CommonSpaceInterface["body"];
  setBody: React.Dispatch<React.SetStateAction<CommonSpaceInterface["body"]>>;
  param: CommonSpaceInterface["param"];
  setParam: React.Dispatch<React.SetStateAction<CommonSpaceInterface["param"]>>;
}
