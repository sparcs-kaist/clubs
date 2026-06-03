import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AppEnv } from "./env";

type ConfigKey = keyof AppEnv;

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<AppEnv, true>) {}

  private getRequired<Key extends ConfigKey>(
    key: Key,
  ): NonNullable<AppEnv[Key]> {
    return this.configService.getOrThrow(key);
  }

  private getOptional<Key extends ConfigKey>(
    key: Key,
  ): AppEnv[Key] | undefined {
    return this.configService.get(key);
  }

  private getOptionalString<Key extends ConfigKey>(key: Key): string {
    return this.getOptional(key) as string;
  }

  get nodeEnv(): AppEnv["NODE_ENV"] {
    return this.getRequired("NODE_ENV");
  }

  get isLocal(): boolean {
    return this.nodeEnv === "local";
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === "development";
  }

  get isProduction(): boolean {
    return this.nodeEnv === "production";
  }

  get serverPort(): number {
    return this.getRequired("SERVER_PORT");
  }

  get secretKey(): string {
    return this.getRequired("SECRET_KEY");
  }

  get clientPort(): string | undefined {
    return this.getOptional("CLIENT_PORT");
  }

  get ssoClientId(): string {
    return this.getOptionalString("SSO_CLIENT_ID");
  }

  get ssoSecretKey(): string {
    return this.getOptionalString("SSO_SECRET_KEY");
  }

  get jwtSecret(): string {
    return this.getOptionalString("JWT_SECRET");
  }

  get jwtExpiresIn(): string {
    return this.getOptionalString("JWT_EXPIRES_IN");
  }

  get accessTokenSecretKey(): string {
    return this.getOptionalString("ACCESS_TOKEN_SECRET_KEY");
  }

  get accessTokenExpiresIn(): string {
    return this.getOptionalString("ACCESS_TOKEN_EXPIRES_IN");
  }

  get accessTokenExpiresInMs(): number {
    return Number.parseInt(this.accessTokenExpiresIn);
  }

  get refreshTokenSecretKey(): string {
    return this.getOptionalString("REFRESH_TOKEN_SECRET_KEY");
  }

  get refreshTokenExpiresIn(): string {
    return this.getOptionalString("REFRESH_TOKEN_EXPIRES_IN");
  }

  get refreshTokenExpiresInMs(): number {
    return Number.parseInt(this.refreshTokenExpiresIn);
  }

  get userSid(): string | undefined {
    return this.getOptional("USER_SID");
  }

  get userV2StdNo(): string {
    return this.getOptionalString("USER_V2_STD_NO");
  }

  get userV2Email(): string {
    return this.getOptionalString("USER_V2_EMAIL");
  }

  get userV2UserNm(): string {
    return this.getOptionalString("USER_V2_USER_NM");
  }

  get userV2SocpsCd(): string {
    return this.getOptionalString("USER_V2_SOCPS_CD");
  }

  get userV2StdDeptId(): string {
    return this.getOptionalString("USER_V2_STD_DEPT_ID");
  }

  get userV2KaistUid(): string {
    return this.getOptionalString("USER_V2_KAIST_UID");
  }

  get userV2UserId(): string {
    return this.getOptionalString("USER_V2_USER_ID");
  }

  get userV2EmpDeptId(): string {
    return this.getOptional("USER_V2_EMP_DEPT_ID") ?? "20686";
  }

  get s3Region(): string {
    return this.getOptionalString("S3_REGION");
  }

  get s3AccessKey(): string {
    return this.getOptionalString("S3_ACCESS_KEY");
  }

  get s3SecretAccessKey(): string {
    return this.getOptionalString("S3_SECRET_ACCESS_KEY");
  }

  get s3BucketName(): string {
    return this.getOptionalString("S3_BUCKET_NAME");
  }
}
