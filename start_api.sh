#!/bin/bash

# Start FastAPI backend server

cd "$(dirname "$0")"

# Activate venv if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Set API key if not already set
export FIREWORKS_API_KEY="${FIREWORKS_API_KEY:-fw_3ZRAE3N6e8Gx3PrvM8QnrGkA}"
export ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://localhost:3000,http://localhost:5173}"

echo "Starting FastAPI backend server..."
echo "API Key: ${FIREWORKS_API_KEY:0:10}..."
echo "Allowed Origins: $ALLOWED_ORIGINS"
echo ""
echo "The API will be available at: http://localhost:8000"
echo "API docs at: http://localhost:8000/docs"
echo "Press Ctrl+C to stop"
echo ""

# Run the server
python3 api_server.py

