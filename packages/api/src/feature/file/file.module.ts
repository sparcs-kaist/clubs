import { S3Client } from "@aws-sdk/client-s3";
import { forwardRef, Module } from "@nestjs/common";

import { DrizzleModule } from "@sparcs-clubs/api/drizzle/drizzle.module";

import ClubModule from "../club/club.module";
import { FileController } from "./controller/file.controller";
import { FileRepository } from "./repository/file.repository";
import FilePublicService from "./service/file.public.service";
import { FileService } from "./service/file.service";

@Module({
  imports: [DrizzleModule, forwardRef(() => ClubModule)],
  controllers: [FileController],
  providers: [
    FileService,
    FileRepository,
    FilePublicService,
    {
      provide: S3Client,
      useFactory: () =>
        new S3Client({
          region: process.env.S3_REGION,
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          },
        }),
    },
  ],
  exports: [FilePublicService],
})
export default class FileModule {}
