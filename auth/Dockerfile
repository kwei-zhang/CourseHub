FROM node:22-alpine

WORKDIR /app

# Proto and auth app (build context is project root)
COPY proto /app/proto
COPY auth/package.json auth/package-lock.json* auth/prisma.config.ts ./
COPY auth/prisma ./prisma
COPY auth/src ./src
COPY auth/tsconfig.json ./

# Install all deps (prisma CLI for migrate)
RUN npm ci

# Generate Prisma client (output: generated/prisma per schema)
RUN npx prisma generate

EXPOSE 3000

# Run init migration then start (DATABASE_URL from compose)
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
