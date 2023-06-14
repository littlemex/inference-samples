#! /usr/bin/env sh
set -e

HOST=${HOST:-0.0.0.0}
PORT=${PORT:-80}
LOG_LEVEL=${LOG_LEVEL:-info}
APP_MODULE=${APP_MODULE:-main:app}
NEURON_PROCESS_TAG=${NEURON_PROCESS_TAG:-"my_app_1"}

exec uvicorn --reload --host $HOST --port $PORT --log-level $LOG_LEVEL "$APP_MODULE"
