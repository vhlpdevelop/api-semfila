FROM node:18-alpine
LABEL maintainer ""

WORKDIR /usr/src/app/

COPY package*.json ./
RUN apk --no-cache add --virtual .builds-deps build-base python3
RUN apk add --no-cache --virtual .gyp \
        && npm install \
        && apk del .gyp \
        && npm install -g nodemon \
        && npm install -g dotenv
        

COPY . .

CMD ["npm", "start"]