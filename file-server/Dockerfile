FROM node:22-alpine

WORKDIR /app

COPY proto /app/proto
COPY file-server /app/file-server

WORKDIR /app/file-server

ENV NODE_ENV=production

RUN npm ci && npx prisma generate

EXPOSE 5002

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node index.js"]
