FROM node:22-alpine

WORKDIR /app

COPY proto /app/proto
COPY user-server /app/user-server

WORKDIR /app/user-server
RUN npm install --production

ENV NODE_ENV=production
EXPOSE 5001

CMD ["node", "index.js"]
