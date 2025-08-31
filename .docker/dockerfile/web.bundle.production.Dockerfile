# 시험공부하기 싫은 hama@sparcs.org의 빌드 개조
# turbo 편하네요
# 참고자료
# - https://hanyunseong-log.dev/post/build-and-run-nextjs-monorepo-with-docker

FROM node:22-alpine AS base



FROM base AS prunner
RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=web --docker



FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app
COPY --from=prunner /app/out/json/ .
COPY --from=prunner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prunner /app/out/full/ .
RUN corepack enable
RUN pnpm install

ENV NEXT_PUBLIC_API_URL=https://clubs.sparcs.org/api
ENV NEXT_PUBLIC_APP_MODE=production
ENV NEXT_PUBLIC_FLAGS_VERSION=0.0.90
ENV NEXT_PUBLIC_FLAGS_REGISTER_CLUB=1
ENV NEXT_PUBLIC_FLAGS_REGISTER_MEMBER=1
ENV NEXT_PUBLIC_FLAGS_NO_RELEASE=0
RUN pnpm dlx turbo run build --filter=web



FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/packages/web/next.config.mjs .
COPY --from=builder /app/packages/web/package.json .
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next/static ./packages/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/public ./packages/web/public

CMD [ "node", "packages/web/server.js" ]
