FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# We don't build here as it will be done by the "build" service
# or we'll run in dev mode

EXPOSE 3000

# The default command will be overridden by docker-compose
CMD ["npm", "run", "dev"]