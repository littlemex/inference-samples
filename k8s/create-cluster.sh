#!/bin/sh

# aws cli は 2.6.3 以降の必要あり

# install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
eksctl version

# install kubectl
curl -O https://s3.us-west-2.amazonaws.com/amazon-eks/1.24.9/2023-01-11/bin/linux/amd64/kubectl
chmod +x ./kubectl
mkdir -p $HOME/bin && cp ./kubectl $HOME/bin/kubectl && export PATH=$PATH:$HOME/bin
echo 'export PATH=$PATH:$HOME/bin' >> ~/.bashrc

# create EKS cluster
#  https://docs.aws.amazon.com/ja_jp/eks/latest/userguide/create-cluster.html
export CLUSTER=id00008
export REGION=us-east-1
export SUBNETS="subnet-76543210,subnet-01234567" # please change me, イメージ作成用のインスタンスと同じ subnet にしておくと通信テストが楽
eksctl create cluster --name $CLUSTER --region $REGION --version 1.24 --vpc-private-subnets $SUBNETS --without-nodegroup
