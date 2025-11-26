/**
 * TypeScript types for API requests and responses
 */

export type DocumentType = "auto" | "passport" | "driver_license";
export type DeploymentType = "Serverless" | "On-demand";
export type ProcessingStatus = "pending" | "processing" | "completed" | "error";
export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DocumentData {
  document_type?: string;
  full_name?: string;
  full_name_bbox?: number[];
  full_name_confidence?: number;
  date_of_birth?: string;
  date_of_birth_bbox?: number[];
  date_of_birth_confidence?: number;
  document_number?: string;
  document_number_bbox?: number[];
  document_number_confidence?: number;
  expiry_date?: string;
  expiry_date_bbox?: number[];
  expiry_date_confidence?: number;
  issue_date?: string;
  issue_date_bbox?: number[];
  issue_date_confidence?: number;
  nationality?: string;
  nationality_bbox?: number[];
  nationality_confidence?: number;
  address?: string;
  address_bbox?: number[];
  address_confidence?: number;
  extracted_text?: string;
}

export interface DocumentResponse {
  id: string;
  status: ProcessingStatus;
  data?: DocumentData;
  error?: string;
  created_at: string;
  processed_at?: string;
  source_file?: string;
  image_preview?: string;
  model_used?: string;
  inference_time_ms?: number;
}

export interface DocumentListResponse {
  documents: DocumentResponse[];
  total: number;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface UploadDocumentOptions {
  document_type?: DocumentType;
  model?: string;
  deployment_type?: DeploymentType;
  custom_model_path?: string;
}

export interface ApiError {
  detail: string;
}

