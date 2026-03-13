FROM node:22-alpine

WORKDIR /app

COPY frontend /app/frontend

WORKDIR /app/frontend
RUN npm install
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]