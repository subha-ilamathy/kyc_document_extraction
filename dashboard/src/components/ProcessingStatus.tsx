/**
 * Processing Status Component
 * Shows real-time processing status and progress
 */

import React from "react";
import type { ProcessingStatus as StatusType } from "../api/types";

interface ProcessingStatusProps {
  status: StatusType;
  error?: string;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  status,
  error,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          icon: "⏳",
        };
      case "processing":
        return {
          label: "Processing",
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          icon: "🔄",
        };
      case "completed":
        return {
          label: "Completed",
          color: "text-green-600",
          bgColor: "bg-green-100",
          icon: "✓",
        };
      case "error":
        return {
          label: "Error",
          color: "text-red-600",
          bgColor: "bg-red-100",
          icon: "✗",
        };
      default:
        return {
          label: "Unknown",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          icon: "?",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center space-x-4">
        {/* Status Icon */}
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center text-2xl`}
        >
          {config.icon}
        </div>

        {/* Status Text */}
        <div className="flex-1">
          <div className={`text-lg font-semibold ${config.color}`}>
            {config.label}
          </div>
          {status === "processing" && (
            <div className="text-sm text-gray-600 mt-1">
              Extracting information from document...
            </div>
          )}
          {status === "pending" && (
            <div className="text-sm text-gray-600 mt-1">
              Waiting to process...
            </div>
          )}
          {status === "completed" && (
            <div className="text-sm text-gray-600 mt-1">
              Document processed successfully
            </div>
          )}
          {status === "error" && error && (
            <div className="text-sm text-red-600 mt-1">{error}</div>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {status === "processing" && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
        </div>
      )}

      {/* Spinner Animation */}
      {status === "processing" && (
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

