#! /usr/bin/env sh
set -e

HOST=${HOST:-0.0.0.0}
PORT=${PORT:-80}
LOG_LEVEL=${LOG_LEVEL:-info}
APP_MODULE=${APP_MODULE:-main:app}
NUM_WORKER=4

exec gunicorn $APP_MODULE --workers $NUM_WORKER --worker-class uvicorn.workers.UvicornWorker --bind ${HOST}:${PORT} --log-level $LOG_LEVEL