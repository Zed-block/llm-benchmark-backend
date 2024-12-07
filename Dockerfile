FROM node:20-alpine 
WORKDIR /app
COPY package.json .
COPY yarn.lock .
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN yarn install
COPY . .
ENV NODE_ENV=whatEver
RUN yarn run build
CMD [ "node", "./dist/main.js" ]
