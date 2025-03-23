FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies for better caching
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Ensure index.html exists (create if missing)
RUN if [ ! -f "index.html" ] && [ ! -f "public/index.html" ] && [ ! -f "src/index.html" ]; then \
      echo '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>AkaneDoThis - Streamer Twitch Français</title>\n    <link rel="icon" type="image/svg+xml" href="/vite.svg" />\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>' > index.html; \
    fi

# Build the application
ARG TWITCH_CLIENT_ID
ARG TWITCH_CLIENT_SECRET
ENV VITE_TWITCH_CLIENT_ID=$TWITCH_CLIENT_ID
ENV VITE_TWITCH_CLIENT_SECRET=$TWITCH_CLIENT_SECRET
ENV NODE_ENV=production

# Debug info before build
RUN echo "Node version: $(node -v)" && \
    echo "NPM version: $(npm -v)" && \
    echo "Files in root directory:" && \
    ls -la && \
    echo "Files in src directory:" && \
    ls -la src || echo "src directory not found"

# Create dist directory and build
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
