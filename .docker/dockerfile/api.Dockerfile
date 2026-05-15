# 시험공부하기 싫은 hama@sparcs.org의 빌드 개조
# turbo 편하네요

FROM node:22-alpine AS base



FROM base AS prunner
RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=api --docker



FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app
COPY --from=prunner /app/out/json/ .
COPY --from=prunner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prunner /app/out/full/ .
RUN corepack enable
RUN pnpm install
RUN pnpm dlx turbo run build --filter=api



FROM base AS runner

WORKDIR /app
COPY --from=builder /app/ .

WORKDIR /app/packages/api
CMD [ "node", "dist/main" ]
