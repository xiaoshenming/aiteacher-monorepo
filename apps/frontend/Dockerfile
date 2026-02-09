# 前端 Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx nuxi prepare

EXPOSE 3000

CMD ["npm", "run", "dev"]
