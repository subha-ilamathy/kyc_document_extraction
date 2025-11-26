/**
 * Document Upload Component
 * Handles file upload, document type selection, and model configuration
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import type { DocumentType, DeploymentType } from "../api/types";

interface DocumentUploadProps {
  onUpload: (file: File, options: UploadOptions) => void;
  isProcessing?: boolean;
  onFileSelect?: (file: File | null) => void;
  resetSignal?: number;
}

interface UploadOptions {
  document_type: DocumentType;
  model: string;
  deployment_type: DeploymentType;
  custom_model_path?: string;
}

const AVAILABLE_MODELS = [
  "accounts/fireworks/models/qwen2p5-vl-32b-instruct",
  "accounts/fireworks/models/qwen2-vl-72b-instruct",
  "accounts/fireworks/models/llava-v1.5-13b",
];

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "passport", label: "Passport" },
  { value: "driver_license", label: "Driver's License" },
];

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  isProcessing = false,
  onFileSelect,
  resetSignal,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("auto");
  const [model, setModel] = useState<string>(AVAILABLE_MODELS[0]);
  const [deploymentType, setDeploymentType] = useState<DeploymentType>("Serverless");
  const [customModelPath, setCustomModelPath] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (resetSignal === undefined) return;
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [resetSignal]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        // Notify parent component immediately
        if (onFileSelect) {
          onFileSelect(file);
        }
      } else {
        if (onFileSelect) {
          onFileSelect(null);
        }
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log("File selected:", file.name, file.type, file.size);
      if (validateFile(file)) {
        setSelectedFile(file);
        // Notify parent component immediately
        if (onFileSelect) {
          onFileSelect(file);
        }
      } else {
        if (onFileSelect) {
          onFileSelect(null);
        }
      }
    } else {
      console.log("No file selected");
      if (onFileSelect) {
        onFileSelect(null);
      }
    }
  }, [onFileSelect]);

  const validateFile = (file: File): boolean => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload a JPEG, PNG, GIF, or BMP image.");
      return false;
    }

    if (file.size > maxSize) {
      alert("File too large. Maximum size is 10MB.");
      return false;
    }

    return true;
  };

  const handleSubmit = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }

    // Prevent double submission
    if (isProcessing) {
      console.log("Already processing, ignoring duplicate submission");
      return;
    }

    console.log("Submitting file:", selectedFile.name, "Size:", selectedFile.size);

    // Verify file is still valid
    if (selectedFile.size === 0) {
      alert("File appears to be empty. Please select a valid file.");
      return;
    }

    const options: UploadOptions = {
      document_type: documentType,
      model,
      deployment_type: deploymentType,
      custom_model_path: deploymentType === "On-demand" && customModelPath ? customModelPath : undefined,
    };

    console.log("Upload options:", options);

    // Call upload handler with the file
    try {
      onUpload(selectedFile, options);
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [selectedFile, documentType, model, deploymentType, customModelPath, onUpload, isProcessing]);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Identity Document</h2>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={(e) => {
          // Don't trigger if clicking on the remove button or other interactive elements
          if (selectedFile) return;
          const target = e.target as HTMLElement;
          if (target.tagName === "BUTTON" || target.closest("button")) return;
          fileInputRef.current?.click();
        }}
      >
        {selectedFile ? (
          <div className="space-y-3">
            <div className="text-green-600 font-medium">✓ File Selected</div>
            <div className="text-sm text-gray-600 font-medium">{selectedFile.name}</div>
            <div className="text-xs text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
            {/* Image Preview */}
            <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden max-w-md mx-auto">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Selected file preview"
                className="w-full h-auto max-h-48 object-contain bg-gray-50"
              />
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                // Reset file input
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
                if (onFileSelect) {
                  onFileSelect(null);
                }
              }}
              className="text-sm text-red-600 hover:text-red-700 underline"
            >
              Remove File
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-gray-600">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <label
                htmlFor="file-upload"
                className="cursor-pointer"
                onClick={(e) => {
                  // Prevent triggering the parent click handler which also opens the dialog
                  e.stopPropagation();
                }}
              >
                <span className="text-blue-600 hover:text-blue-700 font-medium">
                  Click to upload
                </span>
                <span className="text-gray-600"> or drag and drop</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
                ref={fileInputRef}
              />
            </div>
            <div className="text-xs text-gray-500">
              JPEG, PNG, GIF, BMP (Max 10MB)
            </div>
          </div>
        )}
      </div>

      {/* Configuration Options */}
      <div className="mt-6 space-y-4">
        {/* Document Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m} value={m}>
                {m.split("/").pop()}
              </option>
            ))}
          </select>
        </div>

        {/* Deployment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deployment Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="Serverless"
                checked={deploymentType === "Serverless"}
                onChange={(e) => setDeploymentType(e.target.value as DeploymentType)}
                className="mr-2"
                disabled={isProcessing}
              />
              <span className="text-sm text-gray-700">Serverless</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="On-demand"
                checked={deploymentType === "On-demand"}
                onChange={(e) => setDeploymentType(e.target.value as DeploymentType)}
                className="mr-2"
                disabled={isProcessing}
              />
              <span className="text-sm text-gray-700">On-demand</span>
            </label>
          </div>
        </div>

        {/* Custom Model Path (for On-demand) */}
        {deploymentType === "On-demand" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Model Path (Optional)
            </label>
            <input
              type="text"
              value={customModelPath}
              onChange={(e) => setCustomModelPath(e.target.value)}
              placeholder="e.g., accounts/fireworks/models/your-deployment-id"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            />
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedFile || isProcessing}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            !selectedFile || isProcessing
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isProcessing ? "Processing..." : "Upload and Process"}
        </button>
      </div>
    </div>
  );
};

