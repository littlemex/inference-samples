#!/bin/sh

IMAGE_NAME=model
CONTAINER_NAME=model-server
NETWORK_NAME=network

network_id=$(docker network ls -qf "name=^${NETWORK_NAME}$")
if [ -z "$network_id" ]; then
    docker network create -d bridge $NETWORK_NAME
fi

container_id=$(docker ps -aqf "name=^${CONTAINER_NAME}$")
if [ -n "$container_id" ]; then
    docker rm -f $container_id
fi 

run_opts="-d --name ${CONTAINER_NAME} -p 80:80 --device=/dev/neuron0 --network=${NETWORK_NAME}"
CMD="docker run ${run_opts} ${IMAGE_NAME}"
echo "$CMD"
eval "$CMD"
