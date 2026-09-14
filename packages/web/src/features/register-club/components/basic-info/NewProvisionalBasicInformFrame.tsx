import React from "react";

import { RegistrationTypeEnum } from "@clubs/interface/common/enum/registration.enum";

import ClubNameField from "./_atomic/ClubNameField";
import ProvisionalBasicInformFrame, {
  ProvisionalBasicInformFrameProps,
} from "./ProvisionalBasicInformFrame";

const NewProvisionalBasicInformFrame = (
  props: Omit<ProvisionalBasicInformFrameProps, "children">,
) => (
  <ProvisionalBasicInformFrame {...props}>
    <ClubNameField type={RegistrationTypeEnum.NewProvisional} />
  </ProvisionalBasicInformFrame>
);

export default NewProvisionalBasicInformFrame;
