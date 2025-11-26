/**
 * Main App Component
 * Integrates all components with API client and state management
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DocumentUpload } from "./components/DocumentUpload";
import { ProcessingStatus } from "./components/ProcessingStatus";
import { ResultsDisplay } from "./components/ResultsDisplay";
import { DocumentHistory } from "./components/DocumentHistory";
import { BoundingBoxVisualizer } from "./components/BoundingBoxVisualizer";
import { apiClient } from "./api/client";
import type {
  DocumentResponse,
  DocumentType,
  DeploymentType,
} from "./api/types";

const App: React.FC = () => {
  const [currentDocument, setCurrentDocument] = useState<DocumentResponse | null>(null);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [resultsImageUrl, setResultsImageUrl] = useState<string | null>(null);
  const [uploadResetSignal, setUploadResetSignal] = useState(0);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);

  const updateResultsImage = useCallback((newUrl: string | null) => {
    setResultsImageUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return newUrl;
    });
  }, []);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Automatically show the most recent completed document when available
  useEffect(() => {
    if (isProcessing) return;
    if (currentDocument) return;
    if (documents.length === 0) return;

    const docToShow =
      documents.find((doc) => doc.status === "completed" && doc.data) ||
      documents.find((doc) => doc.data) ||
      documents[0];

    if (!docToShow) return;

    setCurrentDocument(docToShow);
    setHighlightedField(null);
    updateResultsImage(docToShow.image_preview || null);
  }, [documents, currentDocument, isProcessing, updateResultsImage]);

  // Cleanup polling and image URL on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (resultsImageUrl && resultsImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(resultsImageUrl);
      }
    };
  }, [pollingInterval, resultsImageUrl]);

  const loadDocuments = async () => {
    try {
      const response = await apiClient.getDocuments();
      setDocuments(response.documents);
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  };

  const handleUpload = useCallback(
    async (
      file: File,
      options: {
        document_type: DocumentType;
        model: string;
        deployment_type: DeploymentType;
        custom_model_path?: string;
      }
    ) => {
      setIsProcessing(true);
      setError(null);
      setCurrentDocument(null);

      try {
        setHighlightedField(null);
        // Validate file before upload
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp"];
        if (!allowedTypes.includes(file.type)) {
          throw new Error("Invalid file type. Please upload a JPEG, PNG, GIF, or BMP image.");
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          throw new Error("File too large. Maximum size is 10MB.");
        }

        // Upload document - ensure file is still valid
        if (!file || file.size === 0) {
          throw new Error("File is invalid or empty. Please select a valid file.");
        }

        console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type);

        // Verify file is still valid before upload
        if (!file || file.size === 0) {
          throw new Error("File is invalid or was removed. Please select the file again.");
        }

        // Upload document
        const document = await apiClient.uploadDocument(file, options);
        console.log("Upload response:", document);

        if (!document || !document.id) {
          throw new Error("Invalid response from server. Please try again.");
        }

        setCurrentDocument(document);
        setHighlightedField(null);
        if (document.image_preview) {
          updateResultsImage(document.image_preview);
        }
        setDocuments((prev) => [document, ...prev]);

        // Start polling for status updates
        if (document.status === "pending" || document.status === "processing") {
          startPolling(document.id);
        } else if (document.status === "completed") {
          setIsProcessing(false);
        } else if (document.status === "error") {
          setIsProcessing(false);
          setError(document.error || "Processing failed");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed. Please try again.";
        setError(errorMessage);
        setIsProcessing(false);
      }
    },
    [updateResultsImage]
  );

  const startPolling = (documentId: string) => {
    // Clear existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max

    const poll = async () => {
      attempts++;

      // Stop polling after max attempts
        if (attempts > maxAttempts) {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          setIsProcessing(false);
          return;
        }

      try {
        const updated = await apiClient.getDocument(documentId);
        setCurrentDocument(updated);
        if (updated.image_preview) {
          updateResultsImage(updated.image_preview);
        }

        // Update in documents list
        setDocuments((prev) =>
          prev.map((doc) => (doc.id === documentId ? updated : doc))
        );

        // Stop polling if completed or error
        if (updated.status === "completed" || updated.status === "error") {
          if (pollingInterval) {
            window.clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          setIsProcessing(false);

          if (updated.status === "error") {
            setError(updated.error || "Processing failed");
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
        // Don't stop polling on transient errors, but log them
        if (attempts > 5) {
          // After 5 failed attempts, stop polling
          if (pollingInterval) {
            window.clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          setIsProcessing(false);
          setError("Failed to check processing status. Please refresh the page.");
        }
      }
    };

    // Poll every 1 second
    const interval = setInterval(poll, 1000);
    setPollingInterval(interval);
  };

  const handleDocumentClick = useCallback(async (documentId: string) => {
    try {
      const document = await apiClient.getDocument(documentId);
      setCurrentDocument(document);
      setUploadResetSignal((prev) => prev + 1);
      setHighlightedField(null);
      updateResultsImage(document.image_preview || null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load document";
      setError(errorMessage);
    }
  }, [updateResultsImage]);

  const displayImageSource = resultsImageUrl || currentDocument?.image_preview || null;
  const summaryItems = useMemo(() => {
    const data = currentDocument?.data;
    if (!data) return [];
    return [
      data.document_type && `Document classified as ${data.document_type}.`,
      data.full_name && `Identified identity: ${data.full_name}.`,
      data.date_of_birth && `Date of birth recorded as ${data.date_of_birth}.`,
      data.document_number && `Document number detected: ${data.document_number}.`,
      data.expiry_date && `Expires on ${data.expiry_date}.`,
      data.issue_date && `Issued on ${data.issue_date}.`,
      data.nationality && `Nationality captured as ${data.nationality}.`,
      data.address && `Address extracted for identity verification.`,
    ].filter((line): line is string => Boolean(line));
  }, [currentDocument]);

  const extractedTextPreview = useMemo(() => {
    const text = currentDocument?.data?.extracted_text;
    if (!text) return null;
    return text.length > 320 ? `${text.slice(0, 320)}...` : text;
  }, [currentDocument]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
      <div className="px-3 sm:px-4 lg:px-8 py-6">
    <h1 className="text-3xl font-bold text-gray-900">
      KYC Identity Verification Dashboard
    </h1>
    <p className="mt-2 text-sm text-gray-600">
      Upload and process identity documents with OCR extraction
    </p>
  </div>
      </header>

      {/* Main Content */}
      <main className=" px-3 sm:px-4 lg:px-6 py-6">
        <div className="space-y-8">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">✗</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                  <button
                    onClick={() => setError(null)}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Horizontal Layout: Image, Extracted Info, Upload */}
          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1.1fr_0.9fr] gap-8 xl:gap-10">
            {/* Box 1: Image with bounding box */}
            <div className="w-full p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Document Preview</h3>
              {displayImageSource ? (
                <>
                  <BoundingBoxVisualizer
                    imageUrl={displayImageSource}
                    data={currentDocument?.data}
                    highlightedField={highlightedField}
                    onFieldClick={setHighlightedField}
                  />
                  {currentDocument?.data && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <h4 className="text-base font-semibold text-gray-800 mb-2">
                        Descriptive Summary
                      </h4>
                      {summaryItems.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {summaryItems.map((item, idx) => (
                            <li key={`${item}-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No structured values available for description yet.
                        </p>
                      )}
                      {extractedTextPreview && (
                        <div className="mt-3">
                          <h5 className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                            Text Snippet
                          </h5>
                          <p className="text-sm text-gray-600 bg-white rounded-md p-3 border border-gray-200 whitespace-pre-wrap">
                            {extractedTextPreview}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg min-h-[320px] flex items-center justify-center text-gray-500 text-sm">
                  Upload a document to see the image preview with bounding boxes.
                </div>
              )}
            </div>

            {/* Box 2: Extracted Information */}
            <div>
              {currentDocument?.status === "completed" && currentDocument.data ? (
                <ResultsDisplay
                  data={currentDocument.data}
                  documentId={currentDocument.id}
                  highlightedField={highlightedField}
                  onFieldSelect={setHighlightedField}
                />
              ) : (
                <div className="w-full p-6 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[320px] text-gray-500 text-sm">
                  Extracted fields will appear here after processing.
                </div>
              )}
            </div>

            {/* Box 3: Upload Identity Document */}
            <div className="space-y-6">
              <DocumentUpload
                onUpload={handleUpload}
                isProcessing={isProcessing}
                resetSignal={uploadResetSignal}
                onFileSelect={(file) => {
                  setHighlightedField(null);
                  if (file) {
                    const newUrl = URL.createObjectURL(file);
                    updateResultsImage(newUrl);
                  } else {
                    updateResultsImage(null);
                  }
                }}
              />

              <div className="p-4 bg-white rounded-lg shadow">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Processing Status</h4>
                {currentDocument ? (
                  <ProcessingStatus
                    status={currentDocument.status}
                    error={currentDocument.error || undefined}
                  />
                ) : (
                  <p className="text-sm text-gray-500">Upload a document to begin processing.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Document History */}
      <section className="bg-gray-50">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 pb-10">
          <DocumentHistory
            documents={documents}
            onDocumentClick={handleDocumentClick}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
          <p className="text-center text-sm text-gray-500">
            KYC Identity Verification System - Powered by Fireworks AI
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;

