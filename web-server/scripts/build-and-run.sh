#!/bin/sh

cd ../
docker buildx bake web
cd scripts/
./run-web-server.sh