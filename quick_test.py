"""
Quick test script to verify OCR API connection
"""

import os
import sys
from openai import OpenAI

# Set API key
API_KEY = "fw_3ZRAE3N6e8Gx3PrvM8QnrGkA"

def test_connection():
    """Test basic API connection"""
    print("Testing Fireworks AI API connection...")
    print("-" * 50)

    try:
        client = OpenAI(
            api_key=API_KEY,
            base_url="https://api.fireworks.ai/inference/v1"
        )

        # Simple test with a sample image
        print("Making API call to vision model...")
        response = client.chat.completions.create(
            model="accounts/fireworks/models/qwen2p5-vl-32b-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract all text from this image. What do you see?"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": "https://storage.googleapis.com/fireworks-public/image_assets/fireworks-ai-wordmark-color-dark.png"
                            }
                        }
                    ]
                }
            ],
            max_tokens=200
        )

        print("\n✓ API Connection Successful!")
        print("\nResponse:")
        print(response.choices[0].message.content)
        return True

    except Exception as e:
        print(f"\n✗ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)

