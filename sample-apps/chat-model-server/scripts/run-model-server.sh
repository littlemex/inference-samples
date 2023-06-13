#!/bin/sh
ENVHCLFILE=/tmp/env.hcl
. $ENVHCLFILE

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

if [ "$INSTANCE_TYPE" = 'gpu' ]; then
    device_opts="--gpus all"
elif [ "$INSTANCE_TYPE" = 'inf1' ] || [ "$INSTANCE_TYPE" = 'inf2' ]; then
    device_opts="--device=/dev/neuron0"
fi

run_opts="-d --name ${CONTAINER_NAME} -p 80:80 ${device_opts} --network=${NETWORK_NAME} --env-file=${ENVHCLFILE}"
CMD="docker run ${run_opts} ${IMAGE_NAME}"
echo "$CMD"
eval "$CMD"
