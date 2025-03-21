import apiReg011 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg011";
import apiReg015 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg015";
import apiReg022 from "@sparcs-clubs/interface/api/registration/endpoint/apiReg022";
import { UserTypeEnum } from "@sparcs-clubs/interface/common/enum/user.enum";

const registerClubDetailGet = (profile: string, id: string) => {
  if (profile === UserTypeEnum.Executive) {
    return apiReg015.url(id);
  }
  if (profile === UserTypeEnum.Professor) {
    return apiReg022.url(id);
  }
  return apiReg011.url(id);
};

export { registerClubDetailGet };
