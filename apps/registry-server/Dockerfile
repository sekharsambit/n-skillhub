# =============================================================================
# Stage 1: Install production & dev dependencies
# =============================================================================
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS deps
WORKDIR /app

# Install build tools needed for native addon compilation (better-sqlite3)
RUN apk add --no-cache build-base python3

# Copy root manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all package.json files (needed for workspace dependency resolution)
COPY apps/registry-server/package.json ./apps/registry-server/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/core/package.json ./packages/core/
COPY packages/registry-client/package.json ./packages/registry-client/

# Install ALL dependencies (including devDeps needed for build)
RUN pnpm install --frozen-lockfile

# =============================================================================
# Stage 2: Build all workspace dependencies + registry-server
# =============================================================================
FROM base AS build
WORKDIR /app

# Install build tools for native addon compilation
RUN apk add --no-cache build-base python3

# Copy root config files needed by the build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json turbo.json ./

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy all source files for packages that the registry-server depends on
COPY packages/schemas ./packages/schemas
COPY packages/core ./packages/core
COPY packages/registry-client ./packages/registry-client
COPY apps/registry-server ./apps/registry-server

# Build workspace packages first, then the server
RUN pnpm build --filter=@nitor-skillhub/schemas \
    --filter=@nitor-skillhub/core \
    --filter=@nitor-skillhub/registry-client \
    --filter=@nitor-skillhub/registry-server

# =============================================================================
# Stage 3: Production image — only runtime deps + built artifacts
# =============================================================================
FROM node:20-alpine AS production

# Create a non-root user for security
RUN addgroup -S nitor && adduser -S nitor -G nitor

WORKDIR /app

# Enable pnpm in production stage
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Copy only the package manifests needed for production dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/registry-server/package.json ./apps/registry-server/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/core/package.json ./packages/core/
COPY packages/registry-client/package.json ./packages/registry-client/

# Install production dependencies (better-sqlite3 needs build tools)
RUN apk add --no-cache build-base python3 \
  && pnpm install --frozen-lockfile --prod \
  && apk del build-base python3 \
  && rm -rf /var/cache/apk/*

# Copy built artifacts
COPY --from=build /app/packages/schemas/dist ./packages/schemas/dist
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/registry-client/dist ./packages/registry-client/dist
COPY --from=build /app/apps/registry-server/dist ./apps/registry-server/dist

# Create data directory with correct permissions
RUN mkdir -p /data && chown -R nitor:nitor /app /data

USER nitor

EXPOSE 3001

ENV PORT=3001
ENV REGISTRY_DATA_DIR=/data
ENV NODE_ENV=production

VOLUME /data

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "apps/registry-server/dist/index.js"]
