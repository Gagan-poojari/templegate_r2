"use client";

import { useCallback, useState } from "react";

const ACCEPT = "image/jpeg,image/png,image/webp,image/tiff,application/pdf";

export default function InvoiceUploader({ onUpload, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const [poNumber, setPoNumber] = useState("");

  const handleFiles = useCallback(
    async (files) => {
      const file = files?.[0];
      if (!file || !onUpload) return;
      await onUpload(file, { poNumber: poNumber.trim() || undefined });
    },
    [onUpload, poNumber]
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          PO number (optional)
        </label>
        <input
          type="text"
          value={poNumber}
          onChange={(e) => setPoNumber(e.target.value)}
          placeholder="PO-2024-001"
          disabled={disabled}
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          dragOver
            ? "border-slate-900 bg-slate-50"
            : "border-slate-300 bg-white"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <p className="text-sm font-medium text-slate-900">
          Drag & drop invoice image or PDF
        </p>
        <p className="mt-1 text-xs text-slate-500">JPEG, PNG, WebP, TIFF, PDF - max 10 MB</p>
        <label className="mt-4 inline-block cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Choose file
          <input
            type="file"
            accept={ACCEPT}
            className="hidden"
            disabled={disabled}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>
    </div>
  );
}
