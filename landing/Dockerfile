FROM node:18-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=${NODE_ENV}
ENV TWITCH_CLIENT_ID=${TWITCH_CLIENT_ID}
ENV TWITCH_CLIENT_SECRET=${TWITCH_CLIENT_SECRET}
ENV PORT=3000

COPY package*.json ./

RUN npm install

COPY . .

# Add build step to ensure we have a valid build in the container
RUN npm run build

EXPOSE 3000

# Use different commands based on NODE_ENV
CMD if [ "$NODE_ENV" = "production" ]; then \
    npm start; \
    else \
    npm run dev; \
    fi
