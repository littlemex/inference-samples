#!/bin/sh

docker buildx bake model
./run-model-server.sh
