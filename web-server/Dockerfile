FROM python:3.7 as requirements-stage

ENV PYTHONUNBUFFERED=TRUE
ENV PYTHONDONTWRITEBYTECODE=TRUE

WORKDIR /tmp

RUN pip install poetry

COPY ./pyproject.toml ./poetry.lock* /tmp/

RUN poetry export -f requirements.txt --output requirements.txt --without-hashes

FROM tiangolo/uvicorn-gunicorn-fastapi:python3.7 as web-stage

COPY --from=requirements-stage /tmp/requirements.txt /app/server/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /app/server/requirements.txt

COPY ./app/run.sh /app/server/run.sh
COPY ./app/main.py /app/server/main.py

WORKDIR /app/server

EXPOSE 8080

CMD ["./run.sh"]