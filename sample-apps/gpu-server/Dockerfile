ARG REGION
FROM 763104351884.dkr.ecr.${REGION:-us-west-1}.amazonaws.com/pytorch-inference:1.13.1-gpu-py39-cu117-ubuntu20.04-ec2 as base-stage

ENV PYTHONUNBUFFERED=TRUE
ENV PYTHONDONTWRITEBYTECODE=TRUE
ENV AWS_NEURON_VISIBLE_DEVICES=ALL
ENV PATH=/opt/aws/neuron/bin:$PATH

RUN pip install transformers==4.19.2 fugashi==1.1.2 ipadic==1.0.0

# For Trace ---------------------------------------
FROM base as trace-stage

RUN mkdir -p /app/trace/models

ADD ./trace/tracer.py /app/trace

WORKDIR /app/trace/

# For Model Server --------------------------------
FROM base as model-stage

RUN mkdir -p /app/server

COPY ./app/requirements.txt /app/server/requirements.txt
COPY ./trace/transformers.pt /app/server/models/transformers.pt
COPY ./trace/tokenizer /app/server/models/tokenizer
COPY ./app/run.sh /app/server/run.sh
COPY ./app/main.py /app/server/main.py

RUN pip3 install -r /app/server/requirements.txt

WORKDIR /app/server

EXPOSE 8080 80

CMD ["./run.sh"]