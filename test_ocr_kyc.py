"""
Sample Serverless API call to test OCR model for KYC Identity Verification

This script demonstrates how to use Fireworks AI vision models to extract
information from identity documents (Passports, Driver's Licenses) for KYC processes.
"""

import os
import base64
import json
from pathlib import Path
from openai import OpenAI
from typing import Optional, Dict, Any


class KYCIdentityVerifier:
    """OCR-based identity verification using Fireworks AI vision models"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the KYC Identity Verifier

        Args:
            api_key: Fireworks API key. If not provided, reads from FIREWORKS_API_KEY env var
        """
        self.api_key = api_key or os.environ.get("FIREWORKS_API_KEY")
        if not self.api_key:
            raise ValueError(
                "API key not provided. Set FIREWORKS_API_KEY environment variable "
                "or pass api_key parameter"
            )

        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.fireworks.ai/inference/v1"
        )

        # Using a vision model capable of OCR
        self.model = "accounts/fireworks/models/qwen2p5-vl-32b-instruct"

    def _encode_image(self, image_path: str) -> str:
        """Encode local image file to base64"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    def _prepare_image_content(self, image_source: str) -> Dict[str, Any]:
        """
        Prepare image content for API call

        Args:
            image_source: Path to local image file or URL to image

        Returns:
            Dictionary with image content formatted for API
        """
        if image_source.startswith(('http://', 'https://')):
            # Image URL
            return {
                "type": "image_url",
                "image_url": {"url": image_source}
            }
        else:
            # Local file - encode to base64
            base64_image = self._encode_image(image_source)
            return {
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{base64_image}"
                }
            }

    def extract_identity_info(
        self,
        image_source: str,
        document_type: str = "auto"
    ) -> Dict[str, Any]:
        """
        Extract identity information from document image

        Args:
            image_source: Path to local image file or URL to image
            document_type: Type of document - "passport", "driver_license", or "auto"

        Returns:
            Dictionary containing extracted identity information
        """
        # Prepare the prompt based on document type
        if document_type == "passport":
            prompt = self._get_passport_prompt()
        elif document_type == "driver_license":
            prompt = self._get_driver_license_prompt()
        else:
            prompt = self._get_auto_detect_prompt()

        # Prepare image content
        image_content = self._prepare_image_content(image_source)

        # Make API call with structured output
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        image_content
                    ]
                }
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "identity_verification",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "document_type": {
                                "type": "string",
                                "description": "Type of document identified (passport, driver_license, etc.)"
                            },
                            "full_name": {
                                "type": "string",
                                "description": "Full name as it appears on the document - extract complete unmasked value, do not use asterisks or stars"
                            },
                            "full_name_bbox": {
                                "type": "array",
                                "items": {"type": "number"},
                                "description": "Bounding box coordinates [x1, y1, x2, y2] for full_name field"
                            },
                            "full_name_confidence": {
                                "type": "number",
                                "description": "Confidence (0-1) for full_name extraction"
                            },
                            "date_of_birth": {
                                "type": "string",
                                "description": "Date of birth in YYYY-MM-DD format - extract complete unmasked value, do not use asterisks or stars"
                            },
                            "date_of_birth_bbox": {
                                "type": "array",
                                "items": {"type": "number"},
                                "description": "Bounding box coordinates [x1, y1, x2, y2] for date_of_birth field"
                            },
                            "date_of_birth_confidence": {
                                "type": "number",
                                "description": "Confidence (0-1) for date_of_birth extraction"
                            },
                            "document_number": {
                                "type": "string",
                                "description": "Document number (passport number, license number, etc.) - extract complete unmasked value, do not use asterisks or stars"
                            },
                            "document_number_bbox": {
                                "type": "array",
                                "items": {"type": "number"},
                                "description": "Bounding box coordinates [x1, y1, x2, y2] for document_number field"
                            },
                            "document_number_confidence": {
                                "type": "number",
                                "description": "Confidence (0-1) for document_number extraction"
                            },
                            "expiry_date": {
                                "type": "string",
                                "description": "Document expiry date in YYYY-MM-DD format"
                            },
                            "expiry_date_bbox": {
                                "type": "array",
                                "items": {"type": "number"},
                                "description": "Bounding box coordinates [x1, y1, x2, y2] for expiry_date field"
                            },
                            "expiry_date_confidence": {
                                "type": "number",
                                "description": "Confidence (0-1) for expiry_date extraction"
                            },
                            "issue_date": {
                                "type": "string",
                                "description": "Document issue date in YYYY-MM-DD format"
                            },
                            "issue_date_bbox": {
                                "type": "array",
                                "items": {"type": "number"},
                                "description": "Bounding box coordinates [x1, y1, x2, y2] for issue_date field"
                            },
                            "issue_date_confidence": {
                                "type": "number",
                                "description": "Confidence (0-1) for issue_date extraction"
                            },
                            "nationality": {
                                "type": "string",
                                "description": "Nationality as shown on document - extract complete unmasked value, do not use asterisks or stars"
                            },
                            "nationality_bbox": {
                                "type": "array",
                                "items": {"type": "number"},
                                "description": "Bounding box coordinates [x1, y1, x2, y2] for nationality field"
                            },
                            "nationality_confidence": {
                                "type": "number",
                                "description": "Confidence (0-1) for nationality extraction"
                            },
                            "address": {
                                "type": "string",
                                "description": "Address if available on document - extract complete unmasked value, do not use asterisks or stars"
                            },
                            "address_bbox": {
                                "type": "array",
                                "items": {"type": "number"},
                                "description": "Bounding box coordinates [x1, y1, x2, y2] for address field"
                            },
                            "address_confidence": {
                                "type": "number",
                                "description": "Confidence (0-1) for address extraction"
                            },
                            "extracted_text": {
                                "type": "string",
                                "description": "All text extracted from the document - extract complete unmasked text, do not use asterisks or stars"
                            }
                        },
                        "required": [
                            "document_type",
                            "full_name",
                            "document_number",
                            "extracted_text"
                        ]
                    }
                }
            },
            temperature=0.1  # Lower temperature for more consistent extraction
        )

        # Parse and return the response
        result = json.loads(response.choices[0].message.content)
        return result

    def _get_passport_prompt(self) -> str:
        """Get prompt for passport extraction"""
        return """Extract all relevant information from this passport document for KYC identity verification.

IMPORTANT: Extract the COMPLETE, UNMASKED values exactly as they appear on the document. Do NOT mask, redact, or replace any characters with asterisks or stars.

For each extracted field, also provide:
- Bounding box coordinates [x1, y1, x2, y2] in pixels relative to the image size
- A confidence score between 0 and 1 (1 = highest confidence)

For each extracted field, also provide the bounding box coordinates [x1, y1, x2, y2] where:
- (x1, y1) is the top-left corner
- (x2, y2) is the bottom-right corner
- Coordinates are in pixels relative to the image dimensions

Focus on extracting:
- Full name (as it appears on the passport) - extract the complete name without masking
- Date of birth - extract the complete date without masking
- Passport number - extract the complete number without masking
- Expiry date
- Issue date
- Nationality - extract the complete nationality without masking
- Any other identifying information

Be precise and extract dates in YYYY-MM-DD format. Include all visible text from the document. Return the actual values as they appear, not masked versions."""

    def _get_driver_license_prompt(self) -> str:
        """Get prompt for driver's license extraction"""
        return """Extract all relevant information from this driver's license document for KYC identity verification.

IMPORTANT: Extract the COMPLETE, UNMASKED values exactly as they appear on the document. Do NOT mask, redact, or replace any characters with asterisks or stars.

For each extracted field, also provide:
- Bounding box coordinates [x1, y1, x2, y2] in pixels relative to the image size
- A confidence score between 0 and 1 (1 = highest confidence)

For each extracted field, also provide the bounding box coordinates [x1, y1, x2, y2] where:
- (x1, y1) is the top-left corner
- (x2, y2) is the bottom-right corner
- Coordinates are in pixels relative to the image dimensions

Focus on extracting:
- Full name (as it appears on the license) - extract the complete name without masking
- Date of birth - extract the complete date without masking
- License number - extract the complete number without masking
- Expiry date
- Issue date
- Address - extract the complete address without masking
- Any other identifying information

Be precise and extract dates in YYYY-MM-DD format. Include all visible text from the document. Return the actual values as they appear, not masked versions."""

    def _get_auto_detect_prompt(self) -> str:
        """Get prompt for auto-detecting document type"""
        return """Analyze this identity document and extract all relevant information for KYC identity verification.

IMPORTANT: Extract the COMPLETE, UNMASKED values exactly as they appear on the document. Do NOT mask, redact, or replace any characters with asterisks or stars.

For each extracted field, also provide:
- Bounding box coordinates [x1, y1, x2, y2] in pixels relative to the image size
- A confidence score between 0 and 1 (1 = highest confidence)

For each extracted field, also provide the bounding box coordinates [x1, y1, x2, y2] where:
- (x1, y1) is the top-left corner
- (x2, y2) is the bottom-right corner
- Coordinates are in pixels relative to the image dimensions

First, identify the document type (passport, driver's license, national ID, etc.), then extract:
- Full name - extract the complete name without masking
- Date of birth - extract the complete date without masking
- Document number - extract the complete number without masking
- Expiry date
- Issue date
- Nationality (if applicable) - extract the complete nationality without masking
- Address (if applicable) - extract the complete address without masking
- Any other identifying information

Be precise and extract dates in YYYY-MM-DD format. Include all visible text from the document. Return the actual values as they appear, not masked versions."""


def main():
    """Example usage of the KYC Identity Verifier"""

    # Try to get API key from environment or use default
    api_key = os.environ.get("FIREWORKS_API_KEY")
    if not api_key:
        # Default API key (can be overridden by environment variable)
        api_key = "fw_3ZRAE3N6e8Gx3PrvM8QnrGkA"

    # Initialize the verifier
    try:
        verifier = KYCIdentityVerifier(api_key=api_key)
        print("✓ KYC Identity Verifier initialized\n")
    except ValueError as e:
        print(f"✗ Error: {e}")
        print("\nPlease set your API key:")
        print("  export FIREWORKS_API_KEY='your_api_key_here'")
        return

    # Example 1: Test with image URL (using a sample image)
    print("=" * 60)
    print("Example 1: Testing with image URL")
    print("=" * 60)

    # You can replace this with an actual passport/driver's license image URL
    sample_image_url = "https://storage.googleapis.com/fireworks-public/image_assets/fireworks-ai-wordmark-color-dark.png"

    print(f"\nProcessing image from URL: {sample_image_url}")
    print("Note: Replace with actual passport/driver's license image URL\n")

    try:
        result = verifier.extract_identity_info(
            image_source=sample_image_url,
            document_type="auto"
        )

        print("\nExtracted Information:")
        print(json.dumps(result, indent=2))

    except Exception as e:
        print(f"✗ Error processing image: {e}")

    # Example 2: Test with local image file
    print("\n" + "=" * 60)
    print("Example 2: Testing with local image file")
    print("=" * 60)

    # Example local file path (uncomment and provide actual path)
    # local_image_path = "path/to/your/passport.jpg"
    #
    # if Path(local_image_path).exists():
    #     print(f"\nProcessing local image: {local_image_path}\n")
    #     try:
    #         result = verifier.extract_identity_info(
    #             image_source=local_image_path,
    #             document_type="passport"  # or "driver_license"
    #         )
    #
    #         print("\nExtracted Information:")
    #         print(json.dumps(result, indent=2))
    #
    #     except Exception as e:
    #         print(f"✗ Error processing image: {e}")
    # else:
    #     print(f"\n⚠ Local image not found: {local_image_path}")
    #     print("   Uncomment and update the path in the script to test with local files")


if __name__ == "__main__":
    main()

