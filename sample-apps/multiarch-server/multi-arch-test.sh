ECR_REMOTE_URL="xxxxxxxxxxx.dkr.ecr.us-east-1.amazonaws.com"
REMOTE_REPO_NAME="id00026-multi-arch"

TAG="latest"
REMOTE_MANIFEST_URI=${ECR_REMOTE_URL}/${REMOTE_REPO_NAME}:${TAG}
REMOTE_AMD64_URI=${ECR_REMOTE_URL}/${REMOTE_REPO_NAME}:${TAG}-amd64
REMOTE_ARM64_URI=${ECR_REMOTE_URL}/${REMOTE_REPO_NAME}:${TAG}-arm64

LOCAL_AMD64_URI=id00026-arch:${TAG}-amd64 
LOCAL_ARM64_URI=id00026-arch:${TAG}-arm64 

echo "========== build image =========="
docker buildx build --builder amd-arm --platform linux/amd64 -t $LOCAL_AMD64_URI --load .
docker buildx build --builder amd-arm --platform linux/arm64 -t $LOCAL_ARM64_URI --load .

echo "========== push image =========="
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${ECR_REMOTE_URL}

docker tag $LOCAL_AMD64_URI $REMOTE_AMD64_URI
docker tag $LOCAL_ARM64_URI $REMOTE_ARM64_URI

docker push ${REMOTE_AMD64_URI}
docker push ${REMOTE_ARM64_URI}

echo "========== create manifest =========="
docker manifest create ${REMOTE_MANIFEST_URI} \
    ${REMOTE_AMD64_URI}  \
    ${REMOTE_ARM64_URI}
    
docker manifest annotate --arch amd64 ${REMOTE_MANIFEST_URI} $REMOTE_AMD64_URI
docker manifest annotate --arch arm64 ${REMOTE_MANIFEST_URI} $REMOTE_ARM64_URI

docker manifest inspect ${REMOTE_MANIFEST_URI}

echo "========== push manifest =========="
docker manifest push ${REMOTE_MANIFEST_URI}
