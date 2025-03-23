FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies for better caching
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
ARG TWITCH_CLIENT_ID
ARG TWITCH_CLIENT_SECRET
ENV VITE_TWITCH_CLIENT_ID=$TWITCH_CLIENT_ID
ENV VITE_TWITCH_CLIENT_SECRET=$TWITCH_CLIENT_SECRET
ENV NODE_ENV=production

RUN mkdir -p dist && npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Install additional server dependencies
RUN npm install compression helmet cors express dotenv

# Copy built assets from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/public ./public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget -qO- http://localhost:3000/health || exit 1

# Start server
CMD ["node", "server/index.js"]