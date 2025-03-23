# Robust Dockerfile with explicit package-lock handling and fallbacks
FROM node:20-alpine AS base

# Add dependencies needed for node-gyp and other native modules
RUN apk add --no-cache python3 make g++ libc6-compat curl

# Set working directory
WORKDIR /app

# Dependencies stage with handling for package-lock
FROM base AS deps
# Copy both package files for dependency installation
COPY package*.json ./

# Check if package-lock.json exists, if not create one
RUN if [ ! -f package-lock.json ]; then \
    echo "Warning: package-lock.json not found, running npm install to generate it"; \
    npm install --package-lock-only; \
    fi

# First install production dependencies
RUN npm ci --only=production || npm install --only=production
# Save them to a separate directory for the production stage
RUN cp -R node_modules prod_modules
# Then install all dependencies (including dev)
RUN npm ci || npm install

# Development stage
FROM base AS development
ENV NODE_ENV=development
# Copy only the dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules
# Then copy the rest of the code
COPY . .
# Expose ports for Vite and API server
EXPOSE 5173 3000
# Use a healthcheck to ensure the server is running
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use a single command with & to run both processes
CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0 & node server/index.js"]

# Builder stage for production artifacts
FROM base AS builder
ENV NODE_ENV=production
# Copy only the dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy source files
COPY . .
# Build the application
RUN npm run build

# Optimize the production build
RUN npm install -g terser && \
    find dist -name "*.js" -not -name "*.min.js" -exec terser {} -o {} -c passes=2 -m \; && \
    find dist -name "*.css" -exec gzip -9 -k {} \; && \
    find dist -name "*.js" -exec gzip -9 -k {} \; && \
    find dist -name "*.html" -exec gzip -9 -k {} \;

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

# Clean npm cache to reduce image size
RUN npm cache clean --force && \
    # Remove unnecessary files
    rm -rf /tmp/* /var/cache/apk/* && \
    # Create the non-root user
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs && \
    # Set proper permissions
    chown -R nodejs:nodejs /app

# Switch to non-root user for security
USER nodejs

# Health check for API server
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose API port
EXPOSE 3000

# Start the server
CMD ["node", "server/index.js"]