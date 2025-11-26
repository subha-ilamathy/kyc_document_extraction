"""
Shared dependencies for API routes
"""

import os
from test_ocr_kyc import KYCIdentityVerifier

# Initialize shared instances
kyc_verifier = None


def get_kyc_verifier() -> KYCIdentityVerifier:
    """Get or create KYC verifier instance"""
    global kyc_verifier
    if kyc_verifier is None:
        api_key = os.environ.get("FIREWORKS_API_KEY")
        kyc_verifier = KYCIdentityVerifier(api_key=api_key)
    return kyc_verifier
