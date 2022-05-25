#!/bin/sh

container_id=$(docker ps -aqf "name=^model-server$")
if [ -n "$container_id" ]; then
    docker rm -f $container_id
fi 

run_opts="--name model-server -p 80:80 --device=/dev/neuron0"
CMD="docker run -d ${run_opts} inf1-model"
echo "$CMD"
eval "$CMD"
