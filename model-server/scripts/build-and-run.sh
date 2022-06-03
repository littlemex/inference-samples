#!/bin/sh

cd ../
docker buildx bake model
cd scripts/
./run-model-server.sh