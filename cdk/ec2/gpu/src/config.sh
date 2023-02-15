#!/bin/sh -x

sudo apt-get update -y

sudo apt-get install -y python3.7-venv g++

sudo dd if=/dev/zero of=/var/swpfile8G bs=1M count=8192
sudo mkswap /var/swpfile8G
sudo chmod 600 /var/swpfile8G
sudo swapon /var/swpfile8G
free
sudo echo "/var/swpfile8G swap swap defaults 0 0" >> /etc/fstab

cd /home/ubuntu
sudo -u ubuntu python3.7 -m venv pytorch_venv

. ./pytorch_venv/bin/activate

pip3 install -U pip
pip3 install ipykernel
pip3 install jupyter notebook
pip3 install environment_kernels
pip3 install transformers==4.19.2 fugashi==1.1.2 ipadic==1.0.0

mkdir -p /home/ubuntu/.aws

cat <<'EOL' > /home/ubuntu/.aws/credentials
[default]
aws_access_key_id = xx
aws_secret_access_key = xx
region = xx
EOL

cat <<'EOL' > /tmp/env.hcl
CDK_DEFAULT_REGION="ap-northeast-1"
CDK_DEFAULT_ACCOUNT="xx"
REGION="ap-northeast-1"
ACCOUNT_ID="xx"
EOL