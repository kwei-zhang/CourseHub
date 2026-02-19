FROM node:22-alpine

WORKDIR /app

COPY proto /app/proto
COPY file-server /app/file-server

WORKDIR /app/file-server
RUN npm install --production

ENV NODE_ENV=production
EXPOSE 5002

CMD ["node", "index.js"]
