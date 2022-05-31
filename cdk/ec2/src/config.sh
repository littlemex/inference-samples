#!/bin/sh -x

HOME=/home/ubuntu

cd $HOME

# Please see the neuron docs
#   https://awsdocs-neuron.readthedocs-hosted.com/en/latest/neuron-intro/pytorch-setup/pytorch-install.html
sudo apt-get update -y
sudo apt-get install linux-headers-$(uname -r) -y
sudo apt-get install aws-neuron-dkms --allow-change-held-packages -y
sudo apt-get install aws-neuron-tools -y

export PATH=/opt/aws/neuron/bin:$PATH

sudo apt-get install -y python3.7-venv g++
python3.7 -m venv pytorch_venv
source pytorch_venv/bin/activate
pip install -U pip
pip install ipykernel 
pip install jupyter notebook
pip install environment_kernels
pip config set global.extra-index-url https://pip.repos.neuron.amazonaws.com
pip install torch-neuron==1.10.2.* neuron-cc[tensorflow] "protobuf<4" torchvision