#!/bin/sh

set -eu

echo "Applying database migrations..."

python manage.py migrate --noinput

echo "Loading assessment demo data when the database is empty..."
python manage.py seed_demo_data --if-empty

echo "Starting Doomsday Ready API..."

exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --access-logfile - \
    --error-logfile -
