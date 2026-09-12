FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
# PORT + SERVER_ID come from the platform's env vars at runtime.
EXPOSE 3001
CMD ["node", "src/server.js"]
