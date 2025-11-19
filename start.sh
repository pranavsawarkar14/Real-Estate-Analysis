#!/bin/bash

# Try to find and activate the virtual environment
if [ -d "/opt/render/project/src/.venv" ]; then
    source /opt/render/project/src/.venv/bin/activate
    echo "Activated virtual environment"
elif [ -f "/opt/render/project/src/.venv/bin/python" ]; then
    export PATH="/opt/render/project/src/.venv/bin:$PATH"
    echo "Added venv to PATH"
fi

# Show Python path for debugging
which python3
python3 -c "import sys; print(sys.path)"

cd backend
python3 manage.py collectstatic --noinput
python3 manage.py migrate --noinput
python3 manage.py runserver 0.0.0.0:$PORT