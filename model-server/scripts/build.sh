cd ../
source env.hcl
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin 763104351884.dkr.ecr.$REGION.amazonaws.com

docker buildx bake base -f docker-bake.hcl -f env.hcl
docker buildx bake trace -f docker-bake.hcl -f env.hcl

cd  -