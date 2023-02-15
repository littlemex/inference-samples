#!/bin/sh

IMAGE_NAME=model
TAG=':latest'
repoarn=$(aws ecr describe-repositories \
  --query "repositories[?repositoryName==\`${IMAGE_NAME}\`].[repositoryArn][]|[0]" \
  --output text)
region=$(echo $repoarn |sed "s/.*:ecr:\(.*\):\(.*\):repo.*/\1/")
accont=$(echo $repoarn |sed "s/.*:ecr:\(.*\):\(.*\):repo.*/\2/")
registory=${accont}.dkr.ecr.ap-northeast-1.amazonaws.com
image=${registory}/${IMAGE_NAME}${TAG}

aws ecr get-login-password --region $region \
  | docker login --username AWS --password-stdin $registory

docker tag ${IMAGE_NAME}:latest $image

docker push $image
