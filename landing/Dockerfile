# Modern Dockerfile with optimized build process
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Dependencies stage - splits dependencies for better layer caching
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
COPY package.json package-lock.json ./
RUN npm ci --only=production
RUN cp -R node_modules prod_modules
RUN npm ci

# Development stage
FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173 3000
CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0 & node server/index.js"]

# Builder stage for production artifacts
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
WORKDIR /app

# Only copy production dependencies and built files
COPY --from=deps /app/prod_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public
COPY package.json ./

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs && \
    chown -R nodejs:nodejs /app
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["node", "server/index.js"]