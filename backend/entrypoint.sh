#!/bin/sh

set -eu

echo "Applying database migrations..."

python manage.py migrate --noinput

echo "Starting Doomsday Ready API..."

exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --access-logfile - \
    --error-logfile -
