FROM node:14-alpine

WORKDIR /usr/src/app

COPY package.json ./

RUN yarn
RUN yarn global add pm2

COPY . .

RUN yarn build

EXPOSE 3000
CMD ["pm2-runtime","./dist/app.js"]