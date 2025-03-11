import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { ComponentType } from "react";

import { UserTypeEnum } from "@sparcs-clubs/interface/common/enum/user.enum";

import ErrorMessage from "@sparcs-clubs/web/common/components/ErrorMessage";
import { getUserTypeEnumKeyByValue } from "@sparcs-clubs/web/utils/getUserType";
import { getLocalStorageItem } from "@sparcs-clubs/web/utils/localStorage";
import logger from "@sparcs-clubs/web/utils/logger";

import ErrorPageTemplate from "../frames/ErrorPageTemplate";
import LoginRequired from "../frames/LoginRequired";
import getLogin from "../services/getLogin";

export const withAuthorization = <P extends object>(
  WrappedComponent: ComponentType<P>,
  acceptedAuthorization: UserTypeEnum[],
  redirectUrl?: string | -1,
) => {
  const login = async () => {
    try {
      const response = await getLogin();
      window.location.href = response.url;
    } catch (error) {
      logger.error("Login failed", error);
    }
  };

  const WithAuth = (props: P) => {
    const token = getLocalStorageItem("accessToken");
    const router = useRouter();

    if (!token) {
      return <LoginRequired login={login} />;
    }

    const decoded: { name?: string; type?: string } = jwtDecode(token);
    const userTypeKey = getUserTypeEnumKeyByValue(decoded.type ?? "");

    if (
      !userTypeKey ||
      !acceptedAuthorization.includes(UserTypeEnum[userTypeKey])
    ) {
      return (
        <ErrorPageTemplate
          message={
            <ErrorMessage>
              현재 페이지에 대한
              <br />
              접근 권한이 없습니다
            </ErrorMessage>
          }
          buttons={[
            {
              text: "이동하기",
              onClick: () => {
                if (redirectUrl === -1) {
                  router.back();
                } else {
                  router.replace(redirectUrl ?? "/");
                }
              },
            },
          ]}
        />
      );
    }

    return <WrappedComponent {...props} />;
  };

  return WithAuth;
};
