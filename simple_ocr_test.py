"""
Simple example: Serverless API call to test OCR model for KYC

This is a minimal example showing how to make a basic OCR API call
for extracting text from identity documents.
"""

import os
import base64
from openai import OpenAI


def test_ocr_with_image_url():
    """Test OCR with an image URL"""

    # Initialize client
    client = OpenAI(
        api_key=os.environ.get("FIREWORKS_API_KEY"),
        base_url="https://api.fireworks.ai/inference/v1"
    )

    # Make API call to extract text from image
    response = client.chat.completions.create(
        model="accounts/fireworks/models/qwen2p5-vl-32b-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract all text from this identity document. Include name, date of birth, document number, expiry date, and any other identifying information."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "https://storage.googleapis.com/fireworks-public/image_assets/fireworks-ai-wordmark-color-dark.png"
                        }
                    }
                ]
            }
        ]
    )

    print("Extracted Text:")
    print(response.choices[0].message.content)


def test_ocr_with_local_file(image_path: str):
    """Test OCR with a local image file"""

    # Encode image to base64
    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')

    # Initialize client
    client = OpenAI(
        api_key=os.environ.get("FIREWORKS_API_KEY"),
        base_url="https://api.fireworks.ai/inference/v1"
    )

    # Make API call
    response = client.chat.completions.create(
        model="accounts/fireworks/models/qwen2p5-vl-32b-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Extract all text from this passport/driver's license. Format the output as JSON with fields: full_name, date_of_birth, document_number, expiry_date, nationality."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ]
    )

    print("Extracted Information:")
    print(response.choices[0].message.content)


if __name__ == "__main__":
    # Check for API key
    if not os.environ.get("FIREWORKS_API_KEY"):
        print("Error: FIREWORKS_API_KEY environment variable not set")
        print("Please set it with: export FIREWORKS_API_KEY='your_api_key_here'")
        exit(1)

    print("Testing OCR with image URL...")
    print("-" * 50)
    test_ocr_with_image_url()

    # Uncomment to test with local file:
    # print("\n" + "-" * 50)
    # print("Testing OCR with local file...")
    # test_ocr_with_local_file("path/to/your/document.jpg")

