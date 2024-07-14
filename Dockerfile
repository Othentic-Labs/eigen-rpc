FROM node:18

RUN npm install -g npm@10.5.0

RUN npm install -g dotenv-cli

WORKDIR /app

COPY .env .env

RUN dotenv -e .env -- sh -c 'echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > $HOME/.npmrc'

RUN npm i -g @othentic/othentic-cli

ENTRYPOINT [ "othentic-cli" ]