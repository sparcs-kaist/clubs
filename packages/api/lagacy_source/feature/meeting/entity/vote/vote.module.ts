import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import UserModule from "@sparcs-clubs/api/feature/user/user.module";

import VoteController from "./vote.controller";
import { VoteRepository } from "./vote.repository";
import { VoteService } from "./vote.service";

@Module({
  imports: [DrizzleModule, UserModule],
  controllers: [VoteController],
  providers: [VoteService, VoteRepository],
})
export class VoteModule {}
