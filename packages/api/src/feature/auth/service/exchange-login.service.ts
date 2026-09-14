import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Transactional } from "@nestjs-cls/transactional";

import type { ApiAut005RequestQuery } from "@clubs/interface/api/auth/endpoint/apiAut005";

import { CLOCK, Clock } from "@sparcs-clubs/api/common/clock/clock";
import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";
import UserPublicService from "@sparcs-clubs/api/feature/user/service/user.public.service";

import { ExchangeLoginActor } from "../dto/auth.dto";
import { AuthRepository } from "../repository/auth.repository";
import { AuthExchangeLoginRepository } from "../repository/exchange-login/auth-exchange-login.repository";
import { AuthService } from "./auth.service";

type ExchangeLoginUser = ExchangeLoginActor & {
  exchangeActor?: ExchangeLoginActor;
};

@Injectable()
export class ExchangeLoginService {
  constructor(
    private readonly userPublicService: UserPublicService,
    private readonly authRepository: AuthRepository,
    private readonly exchangeRepository: AuthExchangeLoginRepository,
    private readonly authService: AuthService,
    private readonly appConfigService: AppConfigService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async searchUsers(actor: ExchangeLoginUser, query: ApiAut005RequestQuery) {
    await this.checkExecutive(actor);
    return {
      users: await this.userPublicService.searchExchangeLoginUsers(query),
    };
  }

  @Transactional()
  async exchangeLogin(actor: ExchangeLoginUser, userId: number) {
    await this.checkExecutive(actor);
    const target =
      await this.userPublicService.getExchangeLoginUserById(userId);
    if (!target) {
      throw new NotFoundException("로그인할 수 있는 계정을 찾을 수 없습니다.");
    }
    if (!target.sid) {
      throw new NotFoundException("SPARCS SSO에 연결되지 않은 계정입니다.");
    }

    const currentActor = await this.userPublicService.getExchangeLoginUserById(
      actor.id,
    );
    if (!currentActor) {
      throw new NotFoundException("로그인을 실행한 계정을 찾을 수 없습니다.");
    }
    const originalActor = actor.exchangeActor ?? {
      id: currentActor.id,
      email: currentActor.email,
    };
    const user = await this.authRepository.findUserById(userId);
    const accessToken = this.authService.getAccessToken(user, originalActor);
    if (Object.keys(accessToken).length === 0) {
      throw new NotFoundException("로그인할 수 있는 프로필이 없는 계정입니다.");
    }
    const refreshToken = this.authService.getRefreshToken(user, originalActor);
    const refreshTokenExpiresAt = new Date(
      this.clock.now().getTime() +
        this.appConfigService.refreshTokenExpiresInMs,
    );
    await this.exchangeRepository.createExchangeLog({
      actorUserId: currentActor.id,
      actorEmail: currentActor.email,
      targetUserId: target.id,
      targetEmail: target.email,
      originalActorUserId: originalActor.id,
      originalActorEmail: originalActor.email,
    });
    await this.exchangeRepository.storeRefreshToken({
      userId,
      refreshToken,
      expiresAt: refreshTokenExpiresAt,
    });
    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }

  private async checkExecutive(actor: ExchangeLoginUser) {
    await this.userPublicService.checkCurrentExecutiveById(actor.id);
    if (actor.exchangeActor) {
      await this.userPublicService.checkCurrentExecutiveById(
        actor.exchangeActor.id,
      );
    }
  }
}
