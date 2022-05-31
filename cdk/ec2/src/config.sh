#!/bin/sh -x

# Please see the neuron docs
#   https://awsdocs-neuron.readthedocs-hosted.com/en/latest/neuron-intro/pytorch-setup/pytorch-install.html
sudo apt-get update -y
sudo apt-get install linux-headers-$(uname -r) -y
sudo apt-get install aws-neuron-dkms --allow-change-held-packages -y
sudo apt-get install aws-neuron-tools -y

export PATH=/opt/aws/neuron/bin:$PATH

sudo apt-get install -y python3.7-venv g++

cd /home/ubuntu
sudo -u ubuntu python3.7 -m venv pytorch_venv

cat <<'EOL' > pip.sh
#!/bin/sh
export PIP='./pytorch_venv/bin/pip3'
echo $PIP
$PIP install -U pip
$PIP install ipykernel
$PIP install jupyter notebook
$PIP install environment_kernels
$PIP config set global.extra-index-url https://pip.repos.neuron.amazonaws.com
$PIP install torch-neuron==1.10.2.* neuron-cc[tensorflow] "protobuf<4" torchvision
$PIP install transformers==4.19.2 fugashi==1.1.2 ipadic==1.0.0
EOL
chmod +x pip.sh
sudo -u ubuntu ./pip.sh