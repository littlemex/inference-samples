#!/bin/sh

cd ../
docker buildx bake model -f docker-bake.hcl -f env.hcl
cd -
./run-model-server.sh