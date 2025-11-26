/**
 * Document History Component
 * Shows list of processed documents with filters and search
 */

import React, { useState, useMemo } from "react";
import type { DocumentResponse } from "../api/types";

interface DocumentHistoryProps {
  documents: DocumentResponse[];
  onDocumentClick?: (documentId: string) => void;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "completed":
        return { color: "bg-green-100 text-green-800", label: "Completed" };
      case "processing":
        return { color: "bg-blue-100 text-blue-800", label: "Processing" };
      case "pending":
        return { color: "bg-yellow-100 text-yellow-800", label: "Pending" };
      case "error":
        return { color: "bg-red-100 text-red-800", label: "Error" };
      default:
        return { color: "bg-gray-100 text-gray-800", label: status };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

export const DocumentHistory: React.FC<DocumentHistoryProps> = ({
  documents,
  onDocumentClick,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        doc.source_file?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.data?.document_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.id.toLowerCase().includes(searchQuery.toLowerCase());

      // Type filter
      const matchesType =
        filterType === "all" || doc.data?.document_type === filterType;

      // Status filter
      const matchesStatus = filterStatus === "all" || doc.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchQuery, filterType, filterStatus]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const documentTypes = useMemo(() => {
    const types = new Set<string>();
    documents.forEach((doc) => {
      if (doc.data?.document_type) {
        types.add(doc.data.document_type);
      }
    });
    return Array.from(types);
  }, [documents]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Document History ({filteredDocuments.length})
        </h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Document Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No documents found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inference Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Processed At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onDocumentClick?.(doc.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {doc.data?.document_type || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.source_file || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.model_used || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {typeof doc.inference_time_ms === "number"
                      ? `${(doc.inference_time_ms / 1000).toFixed(2)} s`
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.processed_at
                      ? formatDate(doc.processed_at)
                      : doc.created_at
                      ? formatDate(doc.created_at)
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    View Details →
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

