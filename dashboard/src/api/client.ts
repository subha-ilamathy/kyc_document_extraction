/**
 * API client for KYC Identity Verification
 */

import type {
  DocumentResponse,
  DocumentListResponse,
  HealthResponse,
  UploadDocumentOptions,
  ApiError,
} from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const error: ApiError = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch {
          // If response is not JSON, use status text
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("Network error - please check your connection");
    }
  }

  async uploadDocument(
    file: File,
    options: UploadDocumentOptions = {}
  ): Promise<DocumentResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", options.document_type || "auto");
      formData.append("model", options.model || "accounts/fireworks/models/qwen2p5-vl-32b-instruct");
      formData.append("deployment_type", options.deployment_type || "Serverless");

      if (options.custom_model_path) {
        formData.append("custom_model_path", options.custom_model_path);
      }

      const url = `${this.baseUrl}/api/upload`;
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const error: ApiError = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch {
          // If response is not JSON, use status text
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("Upload failed - please check your connection and try again");
    }
  }

  async getDocuments(): Promise<DocumentListResponse> {
    return this.request<DocumentListResponse>("/api/documents");
  }

  async getDocument(documentId: string): Promise<DocumentResponse> {
    return this.request<DocumentResponse>(`/api/documents/${documentId}`);
  }

  async pollProcessingStatus(
    documentId: string,
    maxAttempts: number = 30,
    intervalMs: number = 1000
  ): Promise<DocumentResponse> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const document = await this.getDocument(documentId);

      if (document.status === "completed" || document.status === "error") {
        return document;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      attempts++;
    }

    throw new Error("Processing timeout - document did not complete in time");
  }

  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/api/health");
  }
}

export const apiClient = new ApiClient();
export default apiClient;

