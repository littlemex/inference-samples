ARG REGION
#FROM 763104351884.dkr.ecr.${REGION:-ap-northeast-1}.amazonaws.com/huggingface-pytorch-inference-neuron:1.10.2-transformers4.20.1-neuron-py37-sdk1.19.1-ubuntu18.04 as base-stage
FROM 763104351884.dkr.ecr.${REGION:-ap-northeast-1}.amazonaws.com/pytorch-inference-neuron:1.13.1-neuron-py38-sdk2.10.0-ubuntu20.04 as base-stage

ENV PYTHONUNBUFFERED=TRUE
ENV PYTHONDONTWRITEBYTECODE=TRUE
ENV AWS_NEURON_VISIBLE_DEVICES=ALL
ENV PATH=/opt/aws/neuron/bin:$PATH

RUN pip install transformers==4.18.0
RUN pip config set global.extra-index-url https://pip.repos.neuron.amazonaws.com
RUN pip install torch-neuron neuron-cc[tensorflow] "protobuf" torchvision

# For Trace ---------------------------------------
FROM base as trace-stage

RUN mkdir -p /app/trace/models

ADD ./trace/tracer.py /app/trace

WORKDIR /app/trace/

# For Model Server --------------------------------
FROM base as model-stage

RUN mkdir -p /app/server

COPY ./app/requirements.txt /app/server/requirements.txt
RUN pip3 install -r /app/server/requirements.txt

COPY ./trace/transformers_neuron.pt /app/server/models/transformers_neuron.pt
COPY ./trace/tokenizer /app/server/models/tokenizer
COPY ./app/run.sh /app/server/run.sh
COPY ./app/main.py /app/server/main.py


WORKDIR /app/server

EXPOSE 8080 80

CMD ["./run.sh"]
