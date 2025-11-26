"""
Process all identity documents from images/ directory for KYC verification
"""

import os
import json
from pathlib import Path
from test_ocr_kyc import KYCIdentityVerifier

# API key
API_KEY = "fw_3ZRAE3N6e8Gx3PrvM8QnrGkA"

def process_all_images():
    """Process all images in the images/ directory"""

    # Initialize verifier
    verifier = KYCIdentityVerifier(api_key=API_KEY)

    # Get images directory
    images_dir = Path("images")

    if not images_dir.exists():
        print(f"✗ Error: {images_dir} directory not found")
        return

    # Find all image files
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
    image_files = []
    for ext in image_extensions:
        image_files.extend(images_dir.glob(f"*{ext}"))
        image_files.extend(images_dir.glob(f"*{ext.upper()}"))

    if not image_files:
        print(f"✗ No image files found in {images_dir}")
        return

    print(f"Found {len(image_files)} image(s) to process\n")
    print("=" * 80)

    results = []

    for idx, image_path in enumerate(sorted(image_files), 1):
        print(f"\n[{idx}/{len(image_files)}] Processing: {image_path.name}")
        print("-" * 80)

        # Determine document type from filename
        filename_lower = image_path.name.lower()
        if "passport" in filename_lower:
            doc_type = "passport"
        elif "license" in filename_lower:
            doc_type = "driver_license"
        else:
            doc_type = "auto"

        print(f"Document Type: {doc_type}")

        try:
            result = verifier.extract_identity_info(
                image_source=str(image_path),
                document_type=doc_type
            )

            result['source_file'] = image_path.name
            results.append(result)

            print("\n✓ Extraction Successful!")
            print("\nExtracted Information:")
            print(json.dumps(result, indent=2))

        except Exception as e:
            print(f"\n✗ Error processing {image_path.name}: {e}")
            import traceback
            traceback.print_exc()
            results.append({
                'source_file': image_path.name,
                'error': str(e)
            })

        print("\n" + "=" * 80)

    # Save results to JSON file
    output_file = "kyc_extraction_results.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n\n✓ All images processed!")
    print(f"Results saved to: {output_file}")

    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    successful = [r for r in results if 'error' not in r]
    failed = [r for r in results if 'error' in r]

    print(f"Total images: {len(results)}")
    print(f"Successful: {len(successful)}")
    print(f"Failed: {len(failed)}")

    if successful:
        print("\nSuccessfully extracted documents:")
        for r in successful:
            print(f"  - {r['source_file']}: {r.get('document_type', 'unknown')} - {r.get('full_name', 'N/A')}")

    if failed:
        print("\nFailed documents:")
        for r in failed:
            print(f"  - {r['source_file']}: {r.get('error', 'Unknown error')}")

if __name__ == "__main__":
    print("KYC Identity Verification - Batch Processing")
    print("Processing all images from images/ directory")
    print("=" * 80)

    process_all_images()

