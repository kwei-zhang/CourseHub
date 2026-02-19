FROM node:22-alpine

WORKDIR /app

COPY proto /app/proto
COPY system-server /app/system-server

WORKDIR /app/system-server
RUN npm install --production

ENV NODE_ENV=production
EXPOSE 5003

CMD ["node", "index.js"]
