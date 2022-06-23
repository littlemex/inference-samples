#!/bin/sh

IMAGE_NAME=web
CONTAINER_NAME=web-server
ENDPOINT_URL=http://model-server/inferences
NETWORK_NAME=network

network_id=$(docker network ls -qf "name=^${NETWORK_NAME}$")
if [ -z "$network_id" ]; then
    docker network create -d bridge $NETWORK_NAME
fi

container_id=$(docker ps -aqf "name=^${CONTAINER_NAME}$")
if [ -n "$container_id" ]; then
    docker rm -f $container_id
fi

run_opts="--name ${CONTAINER_NAME} -p 81:80 --env ENDPOINT_URL=${ENDPOINT_URL} --network=${NETWORK_NAME}"
CMD="docker run -d ${run_opts} ${IMAGE_NAME}"
echo "$CMD"
eval "$CMD"
