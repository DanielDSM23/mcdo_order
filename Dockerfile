FROM node:18-alpine

WORKDIR /app

COPY server/package.json .

RUN npm install

COPY . .

EXPOSE 8080

ENV NODE_ENV=production

CMD ["node", "server/server.js"]
