FROM node:22-alpine

WORKDIR /app

COPY proto /app/proto
COPY file-server /app/file-server

WORKDIR /app/file-server

ARG DATABASE_URL=postgresql://ece1779:ece1779@localhost:5432/ece1779?schema=files
ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_ENV=production

RUN npm ci && npx prisma generate

EXPOSE 5002

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node index.js"]
