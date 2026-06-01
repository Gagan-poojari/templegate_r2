"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import InvoiceUploader from "@/components/invoices/InvoiceUploader";
import { useInvoices } from "@/hooks/useInvoices";

export default function InvoiceUploadPage() {
  const router = useRouter();
  const { upload, loading, error } = useInvoices();
  const [message, setMessage] = useState("");

  async function handleUpload(file, extras) {
    setMessage("");
    const invoice = await upload(file, extras);
    setMessage("Upload complete. OCR finished - review extracted fields.");
    router.push(`/invoices/${invoice.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Upload invoice</h1>
      <p className="mt-2 text-slate-600">
        Images use Tesseract first; PDFs and low-confidence scans use Gemini AI (set{" "}
        <code className="text-xs bg-slate-100 px-1 rounded">GEMINI_API_KEY</code> in .env.local).
        First run may take up to a minute.
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
          {message}
        </p>
      )}

      <div className="mt-6">
        <InvoiceUploader onUpload={handleUpload} disabled={loading} />
      </div>

      {loading && (
        <p className="mt-4 text-sm text-slate-600 animate-pulse">
          Processing upload and OCR… this can take up to a minute.
        </p>
      )}
    </div>
  );
}
