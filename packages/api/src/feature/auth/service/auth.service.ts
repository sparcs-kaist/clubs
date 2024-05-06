import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { getJwtConfig } from "@sparcs-clubs/api/env";
import { UserRepository } from "src/common/repository/user.repository";
import { UserTokenDto } from "@sparcs-clubs/api/common/dto/user.dto";
import { SSOUser } from "../dto/sso.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  public async findBySid(sid: string) {
    return this.userRepository.findBySid(sid);
  }

  public async ssoLogin(ssoProfile: SSOUser) {
    const { sid } = ssoProfile;
    let user = await this.findBySid(sid);

    // const kaistInfo = ssoProfile.kaist_info;
    // const studentId = kaistInfo.ku_std_no ?? "";

    const { accessToken, ...accessTokenOptions } =
      this.getCookieWithAccessToken(sid);
    const { refreshToken, ...refreshTokenOptions } =
      this.getCookieWithRefreshToken(sid);

    const salt = await bcrypt.genSalt(Number(process.env.saltRounds));
    const encryptedRefreshToken = await bcrypt.hash(refreshToken, salt);

    if (!user) {
      user = await this.createUser(
        sid,
        ssoProfile.email,
        ssoProfile.first_name,
        ssoProfile.last_name,
        encryptedRefreshToken,
      );
    } else {
      user = await this.updateUser(
        user.id,
        sid,
        ssoProfile.email,
        ssoProfile.first_name,
        ssoProfile.last_name,
        encryptedRefreshToken,
      );
    }

    return {
      accessToken,
      accessTokenOptions,
      refreshToken,
      refreshTokenOptions,
    };
  }

  // public getCookieWithToken<T extends "refreshToken" | "accessToken">(
  //   sid: string,
  // ) {}

  public getCookieWithAccessToken(sid: string) {
    const payload = {
      sid,
    };

    const jwtConfig = getJwtConfig();
    const token = this.jwtService.sign(payload, {
      secret: jwtConfig.secret,
      expiresIn: `${jwtConfig.signOptions.expiresIn}s`,
    });
    return {
      accessToken: token,
      path: "/",
      httpOnly: true,
      maxAge: Number(jwtConfig.signOptions.expiresIn) * 1000,
    };
  }

  public getCookieWithRefreshToken(sid: string) {
    const payload = {
      sid,
    };

    const jwtConfig = getJwtConfig();
    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtConfig.secret,
      expiresIn: `${jwtConfig.signOptions.refreshExpiresIn}s`,
    });
    return {
      refreshToken,
      path: "/",
      httpOnly: true,
      maxAge: Number(jwtConfig.signOptions.refreshExpiresIn) * 1000,
    };
  }

  async createUser(
    sid: string,
    email: string,
    firstName: string,
    lastName: string,
    refreshToken: string,
  ): Promise<UserTokenDto> {
    const user = {
      sid,
      email,
      name: `${lastName}${firstName}`,
      refreshToken,
    };
    return this.userRepository.createUser(user);
  }

  async updateUser(
    userId: number,
    sid: string,
    email: string,
    firstName: string,
    lastName: string,
    refreshToken: string,
  ): Promise<UserTokenDto> {
    const user = {
      sid,
      email,
      firstName,
      lastName,
      refreshToken,
    };
    return this.userRepository.updateUser(userId, user);
  }
}
