import apiAct002 from "@clubs/interface/api/activity/endpoint/apiAct002";
import apiAct011 from "@clubs/interface/api/activity/endpoint/apiAct011";
import apiAct012 from "@clubs/interface/api/activity/endpoint/apiAct012";
import apiAct013 from "@clubs/interface/api/activity/endpoint/apiAct013";
import apiAct014 from "@clubs/interface/api/activity/endpoint/apiAct014";
import apiAct015 from "@clubs/interface/api/activity/endpoint/apiAct015";
import apiAct029 from "@clubs/interface/api/activity/endpoint/apiAct029";
import { UserTypeEnum } from "@clubs/interface/common/enum/user.enum";

const activitiesGet = (profile: string) => {
  if (profile === UserTypeEnum.Professor) {
    return apiAct013.url();
  }
  if (profile === UserTypeEnum.Executive) {
    return apiAct012.url();
  }
  return apiAct011.url();
};

const activityDetailGet = (profile: string, id: number) => {
  if (profile === UserTypeEnum.Professor) {
    return apiAct015.url(id);
  }
  if (profile === UserTypeEnum.Executive) {
    return apiAct014.url(id);
  }
  return apiAct002.url(id);
};

const activityReportProvisionalGet = (id: number) => apiAct029.url(id);

export { activitiesGet, activityDetailGet, activityReportProvisionalGet };
