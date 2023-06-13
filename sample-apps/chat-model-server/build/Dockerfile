ARG REGION
ARG IMAGEPATH
ARG INSTANCE_TYPE
FROM 763104351884.dkr.ecr.${REGION:-ap-northeast-1}.amazonaws.com/${IMAGEPATH} AS base-stage

ENV PYTHONUNBUFFERED=TRUE
ENV PYTHONDONTWRITEBYTECODE=TRUE
ENV AWS_NEURON_VISIBLE_DEVICES=ALL
ENV PATH=/opt/aws/neuron/bin:$PATH

RUN pip config set global.extra-index-url https://pip.repos.neuron.amazonaws.com


# For Trace ---------------------------------------
FROM base-stage AS trace-inf1-stage
ONBUILD ADD ./trace/requirements_inf1.txt /tmp/requirements.txt

FROM base-stage AS trace-inf2-stage
ONBUILD ADD ./trace/requirements_inf2.txt /tmp/requirements.txt

FROM trace-${INSTANCE_TYPE}-stage AS trace-stage

RUN pip install -r /tmp/requirements.txt

RUN mkdir -p /app/trace/models

ADD ./trace/tracer.py /app/trace

WORKDIR /app/trace/

# For Model Server --------------------------------
FROM base AS model-stage

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
