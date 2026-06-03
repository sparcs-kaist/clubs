import { S3Client } from "@aws-sdk/client-s3";
import { forwardRef, Module } from "@nestjs/common";

import { AppConfigService } from "@sparcs-clubs/api/config/app-config.service";

import ClubModule from "../club/club.module";
import { FileController } from "./controller/file.controller";
import { FileRepository } from "./repository/file.repository";
import FilePublicService from "./service/file.public.service";
import { FileService } from "./service/file.service";

@Module({
  imports: [forwardRef(() => ClubModule)],
  controllers: [FileController],
  providers: [
    FileService,
    FileRepository,
    FilePublicService,
    {
      provide: S3Client,
      useFactory: (appConfigService: AppConfigService) =>
        new S3Client({
          region: appConfigService.s3Region,
          credentials: {
            accessKeyId: appConfigService.s3AccessKey,
            secretAccessKey: appConfigService.s3SecretAccessKey,
          },
        }),
      inject: [AppConfigService],
    },
  ],
  exports: [FilePublicService],
})
export default class FileModule {}
