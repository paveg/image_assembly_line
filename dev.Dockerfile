ARG NODE_VERSION
FROM node:$NODE_VERSION-slim AS base

ARG DOCKER_VERSION
RUN apt update \
    && apt install icu-devtools git sudo curl ca-certificates build-essential unzip openssh-client systemd -y --no-install-recommends \
    && curl -L -o docker.tgz https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_VERSION}.tgz \
    && tar -xvf docker.tgz \
    && install -o root -g root -m 755 docker/docker /usr/local/bin/docker \
    && rm -rf docker docker.tgz \
    && curl -L -o /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 \
    && chmod +x /usr/local/bin/dumb-init
WORKDIR /app
COPY . .
ENTRYPOINT ["/usr/local/bin/dumb-init", "--"]

FROM base AS dev
RUN npm install
