"""
Test OCR extraction from passport/driver's license for KYC

This script demonstrates extracting structured information from identity documents.
"""

import os
import json
from test_ocr_kyc import KYCIdentityVerifier

# API key
API_KEY = "fw_3ZRAE3N6e8Gx3PrvM8QnrGkA"

def test_with_url(image_url: str, doc_type: str = "auto"):
    """Test OCR extraction with image URL"""
    print(f"\n{'='*60}")
    print(f"Testing OCR with image URL")
    print(f"Document Type: {doc_type}")
    print(f"{'='*60}\n")

    verifier = KYCIdentityVerifier(api_key=API_KEY)

    try:
        result = verifier.extract_identity_info(
            image_source=image_url,
            document_type=doc_type
        )

        print("✓ Extraction Successful!\n")
        print("Extracted Information:")
        print(json.dumps(result, indent=2))
        return result

    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_with_local_file(image_path: str, doc_type: str = "auto"):
    """Test OCR extraction with local image file"""
    print(f"\n{'='*60}")
    print(f"Testing OCR with local file")
    print(f"File: {image_path}")
    print(f"Document Type: {doc_type}")
    print(f"{'='*60}\n")

    verifier = KYCIdentityVerifier(api_key=API_KEY)

    try:
        result = verifier.extract_identity_info(
            image_source=image_path,
            document_type=doc_type
        )

        print("✓ Extraction Successful!\n")
        print("Extracted Information:")
        print(json.dumps(result, indent=2))
        return result

    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    print("KYC Identity Verification - OCR Test")
    print("=" * 60)

    # Example 1: Test with sample image URL
    # Replace with actual passport/driver's license image URL
    sample_url = "https://storage.googleapis.com/fireworks-public/image_assets/fireworks-ai-wordmark-color-dark.png"

    print("\nNote: Replace the sample URL with an actual passport/driver's license image")
    print(f"Current test URL: {sample_url}\n")

    test_with_url(sample_url, doc_type="auto")

    # Example 2: Uncomment to test with local file
    # local_path = "path/to/your/passport.jpg"
    # if os.path.exists(local_path):
    #     test_with_local_file(local_path, doc_type="passport")
    # else:
    #     print(f"\n⚠ Local file not found: {local_path}")
    #     print("   Update the path to test with your own document")

