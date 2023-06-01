#!/bin/sh -x

# Please see the neuron docs
#   https://awsdocs-neuron.readthedocs-hosted.com/en/latest/neuron-intro/pytorch-setup/pytorch-install.html

. /etc/os-release
sudo tee /etc/apt/sources.list.d/neuron.list > /dev/null <<EOF
deb https://apt.repos.neuron.amazonaws.com ${VERSION_CODENAME} main
EOF
wget -qO - https://apt.repos.neuron.amazonaws.com/GPG-PUB-KEY-AMAZON-AWS-NEURON.PUB | sudo apt-key add -
sudo apt-get update -y
sudo apt-get install linux-headers-$(uname -r) -y
sudo apt-get install aws-neuronx-dkms=2.* -y
sudo apt-get install aws-neuronx-tools=2.* -y
export PATH=/opt/aws/neuron/bin:$PATH
sudo apt-get install aws-neuronx-collectives=2.* -y
sudo apt-get install aws-neuronx-runtime-lib=2.* -y

sudo apt-get install -y python3.8-venv g++ 
/usr/bin/python3.8 -m venv aws_neuron_venv_pytorch 
. ./aws_neuron_venv_pytorch/bin/activate # Ubuntu 20 DLAMI Pytorch
/usr/bin/python3.8 -m pip install -U pip 

pip install ipykernel 
/usr/bin/python3.8 -m ipykernel install --user --name aws_neuron_venv_pytorch --display-name "Python (torch-neuronx)"
pip install jupyter notebook
pip install environment_kernels

/usr/bin/python3.8 -m pip config set global.extra-index-url https://pip.repos.neuron.amazonaws.com
/usr/bin/python3.8 -m pip install wget 
/usr/bin/python3.8 -m pip install awscli 
/usr/bin/python3.8 -m pip install --upgrade neuronx-cc==2.* torch-neuronx torchvision


mkdir -p /home/ubuntu/.aws
cat <<'EOL' > /home/ubuntu/.aws/credentials
[default]
aws_access_key_id = xx
aws_secret_access_key = xx
region = us-east-1
EOL

cat <<'EOL' > /tmp/env.hcl
CDK_DEFAULT_REGION="us-east-1"
CDK_DEFAULT_ACCOUNT="xxxx"
REGION="$CDK_DEFAULT_REGION"
ACCOUNT_ID="$CDK_DEFAULT_ACCOUNT"
EOL