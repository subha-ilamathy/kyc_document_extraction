"""
Pydantic models for API request/response
"""

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class ProcessingStatus(BaseModel):
    """Processing status enum"""
    status: Literal["pending", "processing", "completed", "error"]


class DocumentUploadRequest(BaseModel):
    """Request model for document upload"""
    document_type: Literal["auto", "passport", "driver_license"] = Field(
        default="auto",
        description="Type of document to process"
    )
    model: str = Field(
        default="accounts/fireworks/models/qwen2p5-vl-32b-instruct",
        description="Model to use for processing"
    )
    deployment_type: Literal["Serverless", "On-demand"] = Field(
        default="Serverless",
        description="Deployment type"
    )
    custom_model_path: Optional[str] = Field(
        default=None,
        description="Custom model path for on-demand deployment"
    )


class DocumentData(BaseModel):
    """Extracted document data"""
    document_type: Optional[str] = None
    full_name: Optional[str] = None
    full_name_bbox: Optional[list[float]] = Field(default=None, description="Bounding box [x1, y1, x2, y2]")
    full_name_confidence: Optional[float] = Field(default=None, description="Confidence (0-1)")
    date_of_birth: Optional[str] = None
    date_of_birth_bbox: Optional[list[float]] = Field(default=None, description="Bounding box [x1, y1, x2, y2]")
    date_of_birth_confidence: Optional[float] = Field(default=None, description="Confidence (0-1)")
    document_number: Optional[str] = None
    document_number_bbox: Optional[list[float]] = Field(default=None, description="Bounding box [x1, y1, x2, y2]")
    document_number_confidence: Optional[float] = Field(default=None, description="Confidence (0-1)")
    expiry_date: Optional[str] = None
    expiry_date_bbox: Optional[list[float]] = Field(default=None, description="Bounding box [x1, y1, x2, y2]")
    expiry_date_confidence: Optional[float] = Field(default=None, description="Confidence (0-1)")
    issue_date: Optional[str] = None
    issue_date_bbox: Optional[list[float]] = Field(default=None, description="Bounding box [x1, y1, x2, y2]")
    issue_date_confidence: Optional[float] = Field(default=None, description="Confidence (0-1)")
    nationality: Optional[str] = None
    nationality_bbox: Optional[list[float]] = Field(default=None, description="Bounding box [x1, y1, x2, y2]")
    nationality_confidence: Optional[float] = Field(default=None, description="Confidence (0-1)")
    address: Optional[str] = None
    address_bbox: Optional[list[float]] = Field(default=None, description="Bounding box [x1, y1, x2, y2]")
    address_confidence: Optional[float] = Field(default=None, description="Confidence (0-1)")
    extracted_text: Optional[str] = None


class DocumentResponse(BaseModel):
    """Response model for document processing"""
    id: str = Field(description="Unique document ID")
    status: str = Field(description="Processing status")
    data: Optional[DocumentData] = Field(default=None, description="Extracted data")
    error: Optional[str] = Field(default=None, description="Error message if processing failed")
    created_at: datetime = Field(description="Document creation timestamp")
    processed_at: Optional[datetime] = Field(default=None, description="Processing completion timestamp")
    source_file: Optional[str] = Field(default=None, description="Original filename")
    image_preview: Optional[str] = Field(default=None, description="Base64 data URL of the uploaded image")
    model_used: Optional[str] = Field(default=None, description="Model used for this inference")
    inference_time_ms: Optional[int] = Field(default=None, description="Inference time in milliseconds")


class DocumentListResponse(BaseModel):
    """Response model for document list"""
    documents: list[DocumentResponse] = Field(description="List of documents")
    total: int = Field(description="Total number of documents")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(default="healthy", description="Service status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Current timestamp")
