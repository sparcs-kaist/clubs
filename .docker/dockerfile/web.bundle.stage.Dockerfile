# Next14 + pnpm + Monorepo Dockerfile by night (jihopark7777@gmail.com)
# To be frank, I really don't like how this script turned out.
# There's a lot of room for improvement, either in image size or build time.
# Feel free to improve!

# Base image with node + pnpm
# TODO: bump pnpm to 9 (must change 'engine' field in package.json)
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@9.14.4 --activate
WORKDIR /app

# Build to output .next build directory
FROM base AS build
ENV NEXT_PUBLIC_API_URL=https://clubs.stage.sparcs.org/api
ENV NEXT_PUBLIC_APP_MODE=stage
ENV NEXT_PUBLIC_FLAGS_VERSION=1.0.0

COPY pnpm-lock.yaml .
RUN pnpm fetch --filter=web

COPY . .
RUN pnpm --filter=web install -r --offline --prod
RUN pnpm --filter=web build

# Only include production dependencies (Did not make much of a difference in image size)
# FROM base AS production-deps
# COPY pnpm-lock.yaml .
# RUN pnpm fetch --prod
# COPY . .
# RUN pnpm install -r --offline --prod


# Final image (only include runtime files)
FROM base
COPY --from=build /app/packages/web /app/packages/web
COPY --from=build /app/packages/interface /app/packages/interface
COPY --from=build /app/packages/web/node_modules /app/packages/web/node_modules

WORKDIR /app/packages/web
EXPOSE 3000
CMD [ "pnpm", "start" ]
