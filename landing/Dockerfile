# Optimized multi-stage Dockerfile
FROM node:20-alpine AS base

# Add dependencies needed for node-gyp and other native modules
RUN apk add --no-cache python3 make g++ libc6-compat curl

# Set working directory
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./

# Install dependencies with proper handling of package-lock.json
RUN npm ci || npm install
# Save production dependencies to separate directory for production stage
RUN cp -R node_modules prod_modules

# Development stage
FROM base AS development
ENV NODE_ENV=development
# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy source code
COPY . .
# Expose development ports
EXPOSE 5173 3000
# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use a single command with & to run both processes
CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0 & node server/index.js"]

# Builder stage
FROM base AS builder
ENV NODE_ENV=production
# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy source code
COPY . .
# Build the application - output to /app/dist
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
WORKDIR /app

# Only copy production dependencies and server code
COPY --from=deps /app/prod_modules ./node_modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public
COPY package.json ./

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs && \
    mkdir -p /app/dist && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose API port
EXPOSE 3000

# Start the server
CMD ["node", "server/index.js"]