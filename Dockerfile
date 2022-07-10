FROM node:16-alpine
# The minimal baseline we need for Nodejs

RUN apk add make nasm autoconf automake libtool dpkg pkgconfig libpng libpng-dev g++

RUN npm i -g gatsby-cli@3.7.1

# # COPY the package.json file, update any deps and install them
COPY package.json .
# RUN npm update
RUN npm install
RUN mkdir -p /codebuild-lightsail
