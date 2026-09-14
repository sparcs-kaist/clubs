import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UsePipes,
} from "@nestjs/common";
import { Response } from "express";

import apiAut005, {
  ApiAut005RequestQuery,
  ApiAut005ResponseOk,
} from "@clubs/interface/api/auth/endpoint/apiAut005";
import apiAut006, {
  ApiAut006RequestBody,
  ApiAut006ResponseCreated,
} from "@clubs/interface/api/auth/endpoint/apiAut006";

import { ZodPipe } from "@sparcs-clubs/api/common/pipe/zod-pipe";
import { Executive } from "@sparcs-clubs/api/common/util/decorators/method-decorator";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";

import { UserAccessTokenPayload } from "../dto/auth.dto";
import { ExchangeLoginService } from "../service/exchange-login.service";

@Executive()
@Controller("/executive/auth/exchange-login")
export class ExchangeLoginController {
  constructor(
    private readonly exchangeLoginService: ExchangeLoginService,
    private readonly appConfigService: AppConfigService,
  ) {}

  @Get("/users")
  @UsePipes(new ZodPipe(apiAut005))
  async searchUsers(
    @Req() req: UserAccessTokenPayload,
    @Query() query: ApiAut005RequestQuery,
  ): Promise<ApiAut005ResponseOk> {
    return this.exchangeLoginService.searchUsers(req.user, query);
  }

  @Post()
  @UsePipes(new ZodPipe(apiAut006))
  async exchangeLogin(
    @Req() req: UserAccessTokenPayload,
    @Body() body: ApiAut006RequestBody,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiAut006ResponseCreated> {
    const { accessToken, refreshToken, refreshTokenExpiresAt } =
      await this.exchangeLoginService.exchangeLogin(req.user, body.userId);

    ["/auth/refresh", "/auth/sign-out"].forEach(path => {
      res.cookie("refreshToken", refreshToken, {
        expires: refreshTokenExpiresAt,
        httpOnly: true,
        secure: !this.appConfigService.isLocal,
        sameSite: "lax",
        path,
      });
    });
    res.setHeader("Cache-Control", "no-store");
    return { accessToken };
  }
}
