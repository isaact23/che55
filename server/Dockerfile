FROM node:latest

WORKDIR /usr/src/app/server
COPY . .
RUN npm install --production

CMD ["npm", "start"]