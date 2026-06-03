import "reflect-metadata"; // 데코레이터 및 메타데이터를 사용하기 위해 import
import { HttpException } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import express from "express";
import session from "express-session";
import * as swaggerUi from "swagger-ui-express";
import { ZodError } from "zod";

import { generateOpenAPI } from "@clubs/interface/open-api";

import { AppModule } from "./app.module";
import { CLOCK, Clock } from "./common/clock/clock";
import {
  HttpExceptionFilter,
  UnexpectedExceptionFilter,
  ZodErrorFilter,
} from "./common/util/exception.filter";
import logger from "./common/util/logger";
import { AppConfigService } from "./config/app-config.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfigService = app.get(AppConfigService);
  const clock = app.get<Clock>(CLOCK);

  /* swagger 세팅 시작 */
  // OpenAPI 스펙 생성
  const openApiSpec = generateOpenAPI();
  // Swagger UI 제공 (NestJS 기본 SwaggerModule 사용 불가)
  const swaggerApp = express();
  swaggerApp.use(
    "",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      swaggerOptions: {
        operationsSorter: (
          a: {
            get: (arg0: string) => string;
          },
          b: {
            get: (arg0: string) => string;
          },
        ) => {
          const result = a.get("path").localeCompare(b.get("path"));
          return result;
        },
      },
    }),
  );
  app.use("/docs", swaggerApp);
  /* swagger 세팅 끝 */

  app.use(cookieParser());

  app.use(
    session({
      secret: appConfigService.secretKey,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 600000 },
    }),
  );

  // localhost에서의 cors 해결
  if (appConfigService.isLocal) {
    app.enableCors({
      origin: `http://localhost:${appConfigService.clientPort}`,
      credentials: true,
    });
    app.useGlobalFilters(
      new ZodErrorFilter<ZodError>(clock),
      new HttpExceptionFilter<HttpException>(clock),
    );
  } else {
    app.useGlobalFilters(
      new UnexpectedExceptionFilter(clock),
      new ZodErrorFilter<ZodError>(clock),
      new HttpExceptionFilter<HttpException>(clock),
    ); // 만약 global추가하는 경우 AllExceptionFilter 뒤에 추가하면 됨.
  }
  await app.listen(appConfigService.serverPort);
  logger.debug(
    `Server is running on http://localhost:${appConfigService.serverPort}`,
  );
}
bootstrap();
