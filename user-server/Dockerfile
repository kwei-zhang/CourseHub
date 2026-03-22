FROM node:22-alpine

WORKDIR /app

COPY proto /app/proto
COPY user-server /app/user-server

WORKDIR /app/user-server

ARG DATABASE_URL=postgresql://ece1779:ece1779@localhost:5432/ece1779
ENV DATABASE_URL=${DATABASE_URL}

# Install all deps (includes tsx + prisma CLI as devDeps); postinstall runs prisma generate
RUN npm ci

ENV NODE_ENV=production


EXPOSE 5001

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node --import tsx src/index.ts"]
