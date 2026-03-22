FROM node:22-alpine AS builder

WORKDIR /app

COPY frontend /app/frontend

WORKDIR /app/frontend

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time
ARG NEXT_PUBLIC_AUTH_URL=http://localhost:4000
ENV NEXT_PUBLIC_AUTH_URL=${NEXT_PUBLIC_AUTH_URL}

RUN npm ci
RUN npm run build

# ---- runtime ----
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/frontend/package.json /app/frontend/package-lock.json* ./
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
