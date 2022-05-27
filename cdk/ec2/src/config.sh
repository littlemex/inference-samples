BASHRC='/home/ubuntu/.bashrc'

echo export CDK_DEFAULT_REGION=$CDK_DEFAULT_REGION >> $BASHRC
echo export INF1TYPE=inf1.xlarge >> $BASHRC

# Please see the neuron docs
#   https://awsdocs-neuron.readthedocs-hosted.com/en/latest/neuron-intro/pytorch-setup/pytorch-install.html
sudo apt-get update -y
sudo apt-get install linux-headers-$(uname -r) -y
sudo apt-get install aws-neuron-dkms --allow-change-held-packages -y
sudo apt-get install aws-neuron-tools -y

echo export PATH=/opt/aws/neuron/bin:$PATH >> $BASHRC
echo export PATH=~/anaconda3/bin:$PATH >> $BASHRC

sudo apt-get install -y python3.7-venv g++
python3.7 -m venv pytorch_venv
pip install -U pip
pip install ipykernel 
pip install jupyter notebook
pip install environment_kernels
pip config set global.extra-index-url https://pip.repos.neuron.amazonaws.com
pip install torch-neuron neuron-cc[tensorflow] torchvision