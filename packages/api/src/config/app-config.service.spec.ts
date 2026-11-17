import { ConfigService } from "@nestjs/config";

import { AppConfigService } from "./app-config.service";

describe("AppConfigService", () => {
  it("returns required and optional values from ConfigService", () => {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string | number> = {
          NODE_ENV: "local",
        };
        return values[key];
      }),
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          ACCESS_TOKEN_EXPIRES_IN: "1000",
          S3_BUCKET_NAME: "clubs-bucket",
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    const appConfigService = new AppConfigService(configService);

    expect(appConfigService.nodeEnv).toBe("local");
    expect(appConfigService.accessTokenExpiresInMs).toBe(1000);
    expect(appConfigService.s3BucketName).toBe("clubs-bucket");
    expect(appConfigService.jwtSecret).toBeUndefined();
  });

  describe("copyLoginSsoUid", () => {
    const uid = "personal-sso-uid";
    const deployedConfig = (
      nodeEnv: string,
      deployment?: string,
      configuredUid?: string,
    ) => {
      const values = {
        NODE_ENV: nodeEnv,
        CLUBS_API_DEPLOYMENT: deployment,
        COPY_LOGIN_SSO_UID: configuredUid,
      };
      const configService = {
        getOrThrow: (key: keyof typeof values) => values[key],
        get: (key: keyof typeof values) => values[key],
      } as unknown as ConfigService;
      return new AppConfigService(configService);
    };

    it.each<[string, string | undefined]>([
      ["local", undefined],
      ["development", undefined],
      ["production", "stage"],
    ])("reads the configured UID in %s (%s)", (nodeEnv, deployment) => {
      expect(
        deployedConfig(nodeEnv, deployment, ` ${uid} `).copyLoginSsoUid,
      ).toBe(uid);
    });

    it.each<[string, string | undefined]>([
      ["production", undefined],
      ["development", "production"],
      ["test", undefined],
    ])("disables copied login in %s (%s)", (nodeEnv, deployment) => {
      expect(
        deployedConfig(nodeEnv, deployment, uid).copyLoginSsoUid,
      ).toBeUndefined();
    });

    it.each([undefined, "  ", "  TeSt-mock-uid  "])(
      "ignores an absent, blank or shared test UID (%s)",
      configuredUid => {
        expect(
          deployedConfig("production", "stage", configuredUid).copyLoginSsoUid,
        ).toBeUndefined();
      },
    );
  });
});
