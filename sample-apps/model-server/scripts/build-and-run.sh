#!/bin/sh

ENVHCL=/tmp/env.hcl

cd ../
docker buildx bake model -f docker-bake.hcl -f $ENVHCL
cd -
./run-model-server.sh
