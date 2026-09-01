#build stage
FROM node:22-alpine AS build
WORKDIR /app
RUN npm install typescript --silent
COPY ./package*.json ./
RUN npm install --silent --production=false
COPY . .
RUN npm run build

#production stage
FROM node:22-alpine
COPY --from=build /app/package*.json ./
RUN npm install --silent --production
COPY --from=build /app/dist /dist
EXPOSE 5000
CMD ["npm", "start"]
