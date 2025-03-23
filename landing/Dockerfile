FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Add build step to ensure we have a valid build in the container
RUN npm run build

EXPOSE 3000

# The default command will be overridden by docker compose
CMD ["npm", "run", "dev"]
