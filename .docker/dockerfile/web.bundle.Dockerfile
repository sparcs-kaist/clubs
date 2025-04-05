# Next14 + pnpm + Monorepo Dockerfile by night (jihopark7777@gmail.com)
# To be frank, I really don't like how this script turned out.
# There's a lot of room for improvement, either in image size or build time.
# Feel free to improve!

# Base image with node + pnpm
# TODO: bump pnpm to 9 (must change 'engine' field in package.json)
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare pnpm@9.14.4 --activate
WORKDIR /app

# Build to output .next build directory
FROM base AS build
COPY pnpm-lock.yaml .
RUN pnpm fetch
COPY . .
# Build dependencies
RUN pnpm install -r --offline
# Build web
RUN pnpm --filter=web build

# Only include production dependencies (Did not make much of a difference in image size)
# FROM base AS production-deps
# COPY pnpm-lock.yaml .
# RUN pnpm fetch --prod
# COPY . .
# RUN pnpm install -r --offline --prod


# Final image (only include runtime files)
FROM base
# COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages/web /app/packages/web
COPY --from=build /app/packages/interface /app/packages/interface
WORKDIR /app/packages/web

EXPOSE 3000
CMD [ "pnpm", "start" ]
