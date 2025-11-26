#!/bin/bash

# Start Gradio app in Python 3.11 venv

cd "$(dirname "$0")"

# Activate venv
source venv/bin/activate

# Set API key
export FIREWORKS_API_KEY="${FIREWORKS_API_KEY:-fw_3ZRAE3N6e8Gx3PrvM8QnrGkA}"

echo "Starting Gradio app..."
echo "API Key: ${FIREWORKS_API_KEY:0:10}..."
echo ""
echo "The app will be available at: http://localhost:7860"
echo "Press Ctrl+C to stop"
echo ""

# Run the app
python3 gradio_app.py

