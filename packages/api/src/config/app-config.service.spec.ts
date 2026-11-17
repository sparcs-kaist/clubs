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
});
