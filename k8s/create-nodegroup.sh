#!/bin/sh

export CLUSTER=id00008
export REGION=us-east-1
export FAMILY=AmazonLinux2
export INSTANCE_TYPE=g4dn.xlarge
export PUBKEYNAME=cdk-keypair-id00008
export NODEGROUP=ng

# create nodegroup
#  https://docs.aws.amazon.com/ja_jp/eks/latest/userguide/create-managed-node-group.html
eksctl create nodegroup \
  --cluster $CLUSTER \
  --region $REGION \
  --name $NODEGROUP \
  --node-ami-family $FAMILY \
  --node-type $INSTANCE_TYPE \
  --nodes 1 \
  --nodes-min 1 \
  --nodes-max 2 \
  --ssh-access \
  --ssh-public-key $PUBKEYNAME \
  --node-private-networking