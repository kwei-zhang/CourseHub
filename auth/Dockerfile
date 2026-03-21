FROM node:22-alpine

WORKDIR /app

# Proto and auth app (build context is project root)
COPY proto /app/proto
COPY auth/package.json auth/package-lock.json* auth/prisma.config.ts auth/tsconfig.json ./
COPY auth/prisma ./prisma
COPY auth/src ./src

# Install all deps (includes tsx + prisma CLI as devDeps)
RUN npm install

RUN npx prisma generate

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "--import", "tsx", "src/index.ts"]
