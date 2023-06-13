IMAGE_NAME=trace
CONTAINER_NAME=trace
#CMD='python original.py'
CMD='python tracer.py'
ENVHCLFILE='/tmp/env.hcl'

container_id=$(docker ps -aqf "name=^${CONTAINER_NAME}$")
if [ -n "$container_id" ]; then
    docker rm -f $container_id
fi

run_opts=" --rm -m 5G --name ${CONTAINER_NAME} -v ${PWD}:/app/trace/ --memory-swap -1 --oom-kill-disable --env-file=${ENVHCLFILE}"
CMD="docker run ${run_opts} ${IMAGE_NAME} ${CMD}"
echo "$CMD"
eval "$CMD"
