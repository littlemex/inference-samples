# 手順

```bash
export REGION=us-east-1
export ACCOUNT_ID=XXX

aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin 763104351884.dkr.ecr.$REGION.amazonaws.com

docker build --target base-stage -t base --build-arg REGION=$REGION .

# GPU が base image で起動しているか確認
docker run --rm --name `uuidgen` --gpus all base:latest nvidia-smi

docker build --target trace-stage -t trace --build-arg REGION=$REGION .
cd trace && docker run -d --rm -m 5G --name trace -v ${PWD}:/app/trace/ --memory-swap -1 --oom-kill-disable --gpus all trace python tracer.py && cd -

docker network create -d bridge network
docker build --target model-stage -t model --build-arg REGION=$REGION .

docker run -d --name model-server --gpus all -p 80:80 --network=network model

aws ecr get-login-password --region $REGION \
    | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com &&\
    docker tag model:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/model:v002 &&\
    docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/model:v002
```