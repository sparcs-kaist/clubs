import { Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";
import UserModule from "@sparcs-clubs/api/feature/user/user.module";

import { ContentModule } from "./content/content.module";
import { ContentRepository } from "./content/content.repository";
import EntityController from "./entity.controller";
import { EntityRepository } from "./entity.repository";
import { EntityService } from "./entity.service";
import { VoteModule } from "./vote/vote.module";
import { VoteRepository } from "./vote/vote.repository";

@Module({
  imports: [DrizzleModule, UserModule, ContentModule, VoteModule],
  controllers: [EntityController],
  providers: [
    EntityService,
    EntityRepository,
    ContentRepository,
    VoteRepository,
  ],
})
export class EntityModule {}
