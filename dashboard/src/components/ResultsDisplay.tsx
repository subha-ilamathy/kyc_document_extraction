/**
 * Results Display Component
 * Shows KYC extraction results with expandable details
 */

import React, { useState } from "react";
import type { DocumentData } from "../api/types";

interface ResultsDisplayProps {
  data: DocumentData;
  documentId: string;
  highlightedField: string | null;
  onFieldSelect: (field: string | null) => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  data,
  documentId,
  highlightedField,
  onFieldSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Expanded by default to show all info

  const copyToClipboard = () => {
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonString);
    alert("Results copied to clipboard!");
  };

  const downloadJSON = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kyc-results-${documentId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6">
      {/* Extracted Information */}
      <div className="w-full p-6 bg-white rounded-lg shadow-md overflow-x-auto">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Extracted Information</h2>
          <p className="text-sm text-gray-600 mt-1">
            Click on any field to highlight its location on the document preview
          </p>
        </div>

        {/* Main Fields */}
        <div className="space-y-4">
        {data.document_type && (
          <div>
            <label className="text-sm font-medium text-gray-600">Document Type</label>
            <div className="mt-1 text-lg text-gray-800">{data.document_type}</div>
          </div>
        )}

        {data.full_name && (
          <div
            className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
              highlightedField === "full_name"
                ? "border-blue-500 bg-blue-50"
                : "border-transparent hover:border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() =>
              onFieldSelect(highlightedField === "full_name" ? null : "full_name")
            }
          >
            <label className="text-sm font-medium text-gray-600">Full Name</label>
            <div className="mt-1 text-lg text-gray-800 break-words">{data.full_name}</div>
            {typeof data.full_name_confidence === "number" && (
              <div className="text-xs text-gray-500">
                Confidence: {(data.full_name_confidence * 100).toFixed(1)}%
              </div>
            )}
          </div>
        )}

        {data.date_of_birth && (
          <div
            className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
              highlightedField === "date_of_birth"
                ? "border-green-500 bg-green-50"
                : "border-transparent hover:border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() =>
              onFieldSelect(
                highlightedField === "date_of_birth" ? null : "date_of_birth"
              )
            }
          >
            <label className="text-sm font-medium text-gray-600">Date of Birth</label>
            <div className="mt-1 text-lg text-gray-800 break-words">{data.date_of_birth}</div>
            {typeof data.date_of_birth_confidence === "number" && (
              <div className="text-xs text-gray-500">
                Confidence: {(data.date_of_birth_confidence * 100).toFixed(1)}%
              </div>
            )}
          </div>
        )}

        {data.document_number && (
          <div
            className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
              highlightedField === "document_number"
                ? "border-orange-500 bg-orange-50"
                : "border-transparent hover:border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() =>
              onFieldSelect(
                highlightedField === "document_number" ? null : "document_number"
              )
            }
          >
            <label className="text-sm font-medium text-gray-600">Document Number</label>
            <div className="mt-1 text-lg text-gray-800 break-words break-all">{data.document_number}</div>
            {typeof data.document_number_confidence === "number" && (
              <div className="text-xs text-gray-500">
                Confidence: {(data.document_number_confidence * 100).toFixed(1)}%
              </div>
            )}
          </div>
        )}

        {data.expiry_date && (
          <div
            className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
              highlightedField === "expiry_date"
                ? "border-purple-500 bg-purple-50"
                : "border-transparent hover:border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() =>
              onFieldSelect(highlightedField === "expiry_date" ? null : "expiry_date")
            }
          >
            <label className="text-sm font-medium text-gray-600">Expiry Date</label>
            <div className="mt-1 text-lg text-gray-800 break-words">{data.expiry_date}</div>
            {typeof data.expiry_date_confidence === "number" && (
              <div className="text-xs text-gray-500">
                Confidence: {(data.expiry_date_confidence * 100).toFixed(1)}%
              </div>
            )}
          </div>
        )}

        {data.issue_date && (
          <div
            className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
              highlightedField === "issue_date"
                ? "border-pink-500 bg-pink-50"
                : "border-transparent hover:border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() =>
              onFieldSelect(highlightedField === "issue_date" ? null : "issue_date")
            }
          >
            <label className="text-sm font-medium text-gray-600">Issue Date</label>
            <div className="mt-1 text-lg text-gray-800 break-words">{data.issue_date}</div>
            {typeof data.issue_date_confidence === "number" && (
              <div className="text-xs text-gray-500">
                Confidence: {(data.issue_date_confidence * 100).toFixed(1)}%
              </div>
            )}
          </div>
        )}

        {data.nationality && (
          <div
            className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
              highlightedField === "nationality"
                ? "border-cyan-500 bg-cyan-50"
                : "border-transparent hover:border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() =>
              onFieldSelect(
                highlightedField === "nationality" ? null : "nationality"
              )
            }
          >
            <label className="text-sm font-medium text-gray-600">Nationality</label>
            <div className="mt-1 text-lg text-gray-800 break-words">{data.nationality}</div>
            {typeof data.nationality_confidence === "number" && (
              <div className="text-xs text-gray-500">
                Confidence: {(data.nationality_confidence * 100).toFixed(1)}%
              </div>
            )}
          </div>
        )}

        {data.address && (
          <div
            className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
              highlightedField === "address"
                ? "border-orange-600 bg-orange-50"
                : "border-transparent hover:border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() =>
              onFieldSelect(highlightedField === "address" ? null : "address")
            }
          >
            <label className="text-sm font-medium text-gray-600">Address</label>
            <div className="mt-1 text-lg text-gray-800 break-words whitespace-pre-wrap">{data.address}</div>
            {typeof data.address_confidence === "number" && (
              <div className="text-xs text-gray-500">
                Confidence: {(data.address_confidence * 100).toFixed(1)}%
              </div>
            )}
          </div>
        )}

        {/* Expandable Section for Additional Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              All extracted information is displayed above. Use the buttons below to copy or download the data.
            </div>
          </div>
        )}

        {/* Expand/Collapse Button - Optional, can be removed if not needed */}
        {false && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {isExpanded ? "Show Less" : "Show More Details"}
          </button>
        )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-3">
          <button
            onClick={copyToClipboard}
            className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Copy to Clipboard
          </button>
          <button
            onClick={downloadJSON}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Download JSON
          </button>
        </div>
      </div>

    </div>
  );
};

