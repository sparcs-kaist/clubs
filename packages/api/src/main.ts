import { HttpException } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import express from "express";
import session from "express-session";
import * as swaggerUi from "swagger-ui-express";
import { ZodError } from "zod";

import { generateOpenAPI } from "@sparcs-clubs/interface/open-api";

import { env } from "@sparcs-clubs/api/env";

import { AppModule } from "./app.module";
import {
  HttpExceptionFilter,
  UnexpectedExceptionFilter,
  ZodErrorFilter,
} from "./common/util/exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /* swagger 세팅 시작 */
  // OpenAPI 스펙 생성
  const openApiSpec = generateOpenAPI();
  // Swagger UI 제공 (NestJS 기본 SwaggerModule 사용 불가)
  const swaggerApp = express();
  swaggerApp.use("", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use("/docs", swaggerApp);
  /* swagger 세팅 끝 */

  app.use(cookieParser());

  app.use(
    session({
      secret: env.SECRET_KEY,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 600000 },
    }),
  );

  // localhost에서의 cors 해결
  if (process.env.NODE_ENV === "local") {
    app.enableCors({
      origin: `http://localhost:${process.env.CLIENT_PORT}`,
      credentials: true,
    });
    app.useGlobalFilters(
      new ZodErrorFilter<ZodError>(),
      new HttpExceptionFilter<HttpException>(),
    );
  } else {
    app.useGlobalFilters(
      new UnexpectedExceptionFilter(),
      new ZodErrorFilter<ZodError>(),
      new HttpExceptionFilter<HttpException>(),
    ); // 만약 global추가하는 경우 AllExceptionFilter 뒤에 추가하면 됨.
  }
  await app.listen(env.SERVER_PORT);
}
bootstrap();
