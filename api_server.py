"""
FastAPI backend server for KYC Identity Verification Dashboard
"""

import os
import uuid
import base64
import tempfile
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from api.models import (
    DocumentUploadRequest,
    DocumentResponse,
    DocumentListResponse,
    HealthResponse,
    DocumentData
)
from api.dependencies import get_kyc_verifier

# Initialize FastAPI app
app = FastAPI(
    title="KYC Identity Verification API",
    description="API for processing identity documents with OCR",
    version="1.0.0"
)

# Configure CORS
allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (replace with database in production)
documents_store: Dict[str, DocumentResponse] = {}


def process_document(
    document_id: str,
    file_path: str,
    document_type: str,
    model: str,
    deployment_type: str,
    custom_model_path: str = None
):
    """Background task to process document"""
    try:
        # Update status to processing
        if document_id in documents_store:
            documents_store[document_id].status = "processing"

        # Validate file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Temporary file not found: {file_path}")

        # Get verifier
        verifier = get_kyc_verifier()

        # Process document
        start_time = time.perf_counter()
        result = verifier.extract_identity_info(
            image_source=file_path,
            document_type=document_type
        )
        inference_time_ms = int((time.perf_counter() - start_time) * 1000)

        # Validate result
        if not result:
            raise ValueError("No data extracted from document")

        # Update document with results
        if document_id in documents_store:
            documents_store[document_id].status = "completed"
            documents_store[document_id].data = DocumentData(**result)
            documents_store[document_id].processed_at = datetime.utcnow()
            documents_store[document_id].inference_time_ms = inference_time_ms

    except FileNotFoundError as e:
        # Update document with error
        if document_id in documents_store:
            documents_store[document_id].status = "error"
            documents_store[document_id].error = f"File error: {str(e)}"
            documents_store[document_id].processed_at = datetime.utcnow()
    except ValueError as e:
        # Update document with error
        if document_id in documents_store:
            documents_store[document_id].status = "error"
            documents_store[document_id].error = f"Processing error: {str(e)}"
            documents_store[document_id].processed_at = datetime.utcnow()
    except Exception as e:
        # Update document with error
        if document_id in documents_store:
            documents_store[document_id].status = "error"
            documents_store[document_id].error = f"Unexpected error: {str(e)}"
            documents_store[document_id].processed_at = datetime.utcnow()
    finally:
        # Clean up temp file
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            # Log cleanup error but don't fail
            print(f"Warning: Failed to clean up temp file {file_path}: {e}")


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse()


@app.post("/api/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_type: str = Form("auto"),
    model: str = Form("accounts/fireworks/models/qwen2p5-vl-32b-instruct"),
    deployment_type: str = Form("Serverless"),
    custom_model_path: str = Form(None)
):
    """
    Upload and process identity document

    - **file**: Image file (JPEG, PNG, etc.)
    - **document_type**: Type of document (auto, passport, driver_license)
    - **model**: Model to use for processing
    - **deployment_type**: Serverless or On-demand
    - **custom_model_path**: Custom model path for on-demand
    """
    try:
        # Validate file exists
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file provided"
            )

        # Validate file type
        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".bmp"}
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )

        # Validate file size (10MB max)
        file_content = await file.read()
        if len(file_content) > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size is 10MB"
            )

        # Validate document_type
        if document_type not in ["auto", "passport", "driver_license"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid document_type. Must be: auto, passport, or driver_license"
            )

        # Validate deployment_type
        if deployment_type not in ["Serverless", "On-demand"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid deployment_type. Must be: Serverless or On-demand"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error validating upload: {str(e)}"
        )

    # Create document ID
    document_id = str(uuid.uuid4())

    # Create base64 preview for frontend display
    mime_type = file.content_type or "image/jpeg"
    base64_data = base64.b64encode(file_content).decode("utf-8")
    image_preview = f"data:{mime_type};base64,{base64_data}"

    # Save file temporarily
    temp_dir = tempfile.gettempdir()
    temp_file_path = os.path.join(temp_dir, f"{document_id}{file_ext}")

    with open(temp_file_path, "wb") as f:
        f.write(file_content)

    # Create document record
    document = DocumentResponse(
        id=document_id,
        status="pending",
        created_at=datetime.utcnow(),
        source_file=file.filename,
        image_preview=image_preview,
        model_used=model
    )
    documents_store[document_id] = document

    # Start background processing
    background_tasks.add_task(
        process_document,
        document_id,
        temp_file_path,
        document_type,
        model,
        deployment_type,
        custom_model_path
    )

    return document


@app.get("/api/documents", response_model=DocumentListResponse)
async def get_documents():
    """Get list of all processed documents"""
    documents = list(documents_store.values())
    # Sort by created_at descending (newest first)
    documents.sort(key=lambda x: x.created_at, reverse=True)
    return DocumentListResponse(
        documents=documents,
        total=len(documents)
    )


@app.get("/api/documents/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str):
    """Get specific document by ID"""
    if document_id not in documents_store:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )
    return documents_store[document_id]


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

