/**
 * Bounding Box Visualizer Component
 * Displays image with bounding boxes overlaid for extracted fields
 */

import React, { useRef, useEffect, useState, useMemo } from "react";
import type { DocumentData } from "../api/types";

interface BoundingBoxVisualizerProps {
  imageUrl: string | null;
  data?: DocumentData | null;
  highlightedField?: string | null;
  onFieldClick?: (fieldName: string | null) => void;
}

interface BoundingBoxInfo {
  field: string;
  label: string;
  bbox: number[];
  color: string;
  confidence?: number;
}

const FIELD_COLORS: Record<string, string> = {
  full_name: "#3B82F6", // Blue
  date_of_birth: "#10B981", // Green
  document_number: "#F59E0B", // Orange
  expiry_date: "#8B5CF6", // Purple
  issue_date: "#EC4899", // Pink
  nationality: "#06B6D4", // Cyan
  address: "#F97316", // Orange-red
};

const FIELD_LABELS: Record<string, string> = {
  full_name: "Full Name",
  date_of_birth: "Date of Birth",
  document_number: "Document Number",
  expiry_date: "Expiry Date",
  issue_date: "Issue Date",
  nationality: "Nationality",
  address: "Address",
};

const orientationToDegrees = (orientation: number): number => {
  switch (orientation) {
    case 3:
      return 180;
    case 6:
      return 90;
    case 8:
      return 270;
    default:
      return 0;
  }
};

const dataUrlToArrayBuffer = (dataUrl: string): ArrayBuffer | null => {
  try {
    const base64Index = dataUrl.indexOf("base64,");
    if (base64Index === -1) {
      return null;
    }
    const base64 = dataUrl.substring(base64Index + 7);
    const binary = atob(base64);
    const len = binary.length;
    const buffer = new ArrayBuffer(len);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < len; i += 1) {
      view[i] = binary.charCodeAt(i);
    }
    return buffer;
  } catch (error) {
    console.error("Failed to decode data URL for EXIF parsing:", error);
    return null;
  }
};

const readExifOrientation = (buffer: ArrayBuffer): number => {
  const view = new DataView(buffer);
  if (view.byteLength < 2 || view.getUint16(0, false) !== 0xffd8) {
    return -1;
  }

  let offset = 2;
  const length = view.byteLength;

  while (offset < length) {
    if (offset + 4 > length) {
      break;
    }

    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xffe1) {
      if (offset + 2 > length) {
        break;
      }

      const exifLength = view.getUint16(offset, false);
      offset += 2;

      if (offset + 4 > length) {
        break;
      }

      if (view.getUint32(offset, false) !== 0x45786966) {
        offset += exifLength - 2;
        continue;
      }

      offset += 6;
      if (offset + 10 > length) {
        break;
      }

      const little = view.getUint16(offset, false) === 0x4949;
      const tiffOffset = view.getUint32(offset + 4, little);
      offset += tiffOffset + 8;

      if (offset + 2 > length) {
        break;
      }

      const tags = view.getUint16(offset, little);
      offset += 2;

      for (let i = 0; i < tags; i += 1) {
        const tagOffset = offset + i * 12;
        if (tagOffset + 12 > length) {
          break;
        }
        if (view.getUint16(tagOffset, little) === 0x0112) {
          return view.getUint16(tagOffset + 8, little);
        }
      }
    } else if ((marker & 0xff00) !== 0xff00) {
      break;
    } else {
      if (offset + 2 > length) {
        break;
      }
      const size = view.getUint16(offset, false);
      offset += size;
    }
  }

  return -1;
};

const loadImageBuffer = async (imageUrl: string): Promise<ArrayBuffer | null> => {
  try {
    if (imageUrl.startsWith("data:")) {
      return dataUrlToArrayBuffer(imageUrl);
    }
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return null;
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.warn("Unable to load image buffer for EXIF orientation:", error);
    return null;
  }
};

const getImageRotationDegrees = async (imageUrl: string): Promise<number> => {
  const buffer = await loadImageBuffer(imageUrl);
  if (!buffer) {
    return 0;
  }
  const orientation = readExifOrientation(buffer);
  return orientationToDegrees(orientation);
};

export const BoundingBoxVisualizer: React.FC<BoundingBoxVisualizerProps> = ({
  imageUrl,
  data,
  highlightedField,
  onFieldClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageRotation, setImageRotation] = useState(0);

  // Collect all bounding boxes using useMemo to prevent recreation on every render
  const boundingBoxes: BoundingBoxInfo[] = useMemo(() => {
    if (!data) return [];

    const boxes: BoundingBoxInfo[] = [];

    if (data.full_name_bbox && data.full_name_bbox.length === 4) {
      boxes.push({
        field: "full_name",
        label: FIELD_LABELS.full_name,
        bbox: data.full_name_bbox,
        color: FIELD_COLORS.full_name,
        confidence: data.full_name_confidence,
      });
    }
    if (data.date_of_birth_bbox && data.date_of_birth_bbox.length === 4) {
      boxes.push({
        field: "date_of_birth",
        label: FIELD_LABELS.date_of_birth,
        bbox: data.date_of_birth_bbox,
        color: FIELD_COLORS.date_of_birth,
        confidence: data.date_of_birth_confidence,
      });
    }
    if (data.document_number_bbox && data.document_number_bbox.length === 4) {
      boxes.push({
        field: "document_number",
        label: FIELD_LABELS.document_number,
        bbox: data.document_number_bbox,
        color: FIELD_COLORS.document_number,
        confidence: data.document_number_confidence,
      });
    }
    if (data.expiry_date_bbox && data.expiry_date_bbox.length === 4) {
      boxes.push({
        field: "expiry_date",
        label: FIELD_LABELS.expiry_date,
        bbox: data.expiry_date_bbox,
        color: FIELD_COLORS.expiry_date,
        confidence: data.expiry_date_confidence,
      });
    }
    if (data.issue_date_bbox && data.issue_date_bbox.length === 4) {
      boxes.push({
        field: "issue_date",
        label: FIELD_LABELS.issue_date,
        bbox: data.issue_date_bbox,
        color: FIELD_COLORS.issue_date,
        confidence: data.issue_date_confidence,
      });
    }
    if (data.nationality_bbox && data.nationality_bbox.length === 4) {
      boxes.push({
        field: "nationality",
        label: FIELD_LABELS.nationality,
        bbox: data.nationality_bbox,
        color: FIELD_COLORS.nationality,
        confidence: data.nationality_confidence,
      });
    }
    if (data.address_bbox && data.address_bbox.length === 4) {
      boxes.push({
        field: "address",
        label: FIELD_LABELS.address,
        bbox: data.address_bbox,
        color: FIELD_COLORS.address,
        confidence: data.address_confidence,
      });
    }

    return boxes;
  }, [data]);

  useEffect(() => {
    let cancelled = false;

    if (!imageUrl) {
      setImageRotation(0);
      return;
    }

    const detectOrientation = async () => {
      const rotationDegrees = await getImageRotationDegrees(imageUrl);
      if (!cancelled) {
        setImageRotation(rotationDegrees);
      }
    };

    detectOrientation();

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const container = containerRef.current;
      if (!container || !canvasRef.current) return;

      const containerWidth = container.clientWidth;
      const maxHeight = 600;

      const rotationNormalsed = ((imageRotation % 360) + 360) % 360;
      const isUpright = rotationNormalsed % 180 === 0;
      const rotatedWidth = isUpright ? img.width : img.height;
      const rotatedHeight = isUpright ? img.height : img.width;

      let displayWidth = containerWidth;
      let displayHeight = containerWidth * (rotatedHeight / rotatedWidth);

      if (displayHeight > maxHeight) {
        displayHeight = maxHeight;
        displayWidth = maxHeight * (rotatedWidth / rotatedHeight);
      }

      const scaleFactor = displayWidth / rotatedWidth;

      const canvas = canvasRef.current;
      canvas.width = displayWidth;
      canvas.height = displayHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(displayWidth / 2, displayHeight / 2);
      ctx.rotate((rotationNormalsed * Math.PI) / 180);
      ctx.scale(scaleFactor, scaleFactor);

      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const drawLineWidth = (value: number) => value / scaleFactor;
      const fontSize = 12 / scaleFactor;

      boundingBoxes.forEach((bboxInfo) => {
        const [x1, y1, x2, y2] = bboxInfo.bbox;
        const isHighlighted = highlightedField === bboxInfo.field;

        const boxX = x1 - img.width / 2;
        const boxY = y1 - img.height / 2;
        const width = x2 - x1;
        const height = y2 - y1;

        ctx.beginPath();
        ctx.strokeStyle = bboxInfo.color;
        ctx.lineWidth = drawLineWidth(isHighlighted ? 4 : 2);
        ctx.setLineDash(isHighlighted ? [] : [5, 5]);
        ctx.rect(boxX, boxY, width, height);
        ctx.stroke();

        ctx.fillStyle = bboxInfo.color + (isHighlighted ? "40" : "20");
        ctx.fillRect(boxX, boxY, width, height);

        const confidenceText =
          typeof bboxInfo.confidence === "number"
            ? ` (${Math.round(bboxInfo.confidence * 100)}%)`
            : "";
        const labelText = `${bboxInfo.label}${confidenceText}`;
        ctx.font = `bold ${fontSize}px sans-serif`;
        const textMetrics = ctx.measureText(labelText);
        const labelPadding = 4 / scaleFactor;
        const labelHeight = fontSize + labelPadding * 2;
        const labelWidth = textMetrics.width + labelPadding * 2;

        ctx.fillStyle = bboxInfo.color;
        ctx.fillRect(
          boxX,
          boxY - labelHeight - labelPadding,
          labelWidth,
          labelHeight
        );

        ctx.fillStyle = "#FFFFFF";
        ctx.textBaseline = "top";
        ctx.fillText(
          labelText,
          boxX + labelPadding,
          boxY - labelHeight - labelPadding + labelPadding
        );
      });

      ctx.restore();
    };

    img.src = imageUrl;
  }, [imageUrl, boundingBoxes, highlightedField, imageRotation]);

  if (!imageUrl) {
    return (
      <div className="w-full p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">No image available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Document with Extracted Fields
        </h3>
        <p className="text-sm text-gray-600">
          Click on fields below to highlight their location on the document
        </p>
      </div>

      <div
        ref={containerRef}
        className="w-full border border-gray-300 rounded-lg overflow-hidden bg-gray-50"
        style={{ maxHeight: "600px", display: "flex", justifyContent: "center" }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Legend */}
      {boundingBoxes.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Extracted Fields:</h4>
          <div className="flex flex-wrap gap-2">
            {boundingBoxes.map((bboxInfo) => (
              <button
                key={bboxInfo.field}
                onClick={() => onFieldClick?.(bboxInfo.field)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  highlightedField === bboxInfo.field
                    ? "ring-2 ring-offset-2 ring-gray-400"
                    : "hover:opacity-80"
                }`}
                style={{
                  backgroundColor: bboxInfo.color,
                  color: "#FFFFFF",
                }}
              >
                {bboxInfo.label}
                {typeof bboxInfo.confidence === "number" && (
                  <span className="ml-1 text-white/80">
                    {Math.round(bboxInfo.confidence * 100)}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

