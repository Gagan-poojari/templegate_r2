"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import OCRResultEditor from "@/components/invoices/OCRResultEditor";
import ValidationPanel from "@/components/invoices/ValidationPanel";
import MatchPanel from "@/components/invoices/MatchPanel";
import MatchStatusBadge from "@/components/invoices/MatchStatusBadge";
import ApprovalChain from "@/components/approvals/ApprovalChain";
import ApprovalActions from "@/components/approvals/ApprovalActions";
import { useInvoices } from "@/hooks/useInvoices";
import { useApprovals } from "@/hooks/useApprovals";
import { useAuth } from "@/hooks/useAuth";
import InvoicePaymentCard from "@/components/invoices/InvoicePaymentCard";
import OcrMethodBadge from "@/components/invoices/OcrMethodBadge";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const { getById, update, runMatch, reocr, loading, error } = useInvoices();
  const { submitForApproval, approve, loading: approvalLoading } = useApprovals();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [saved, setSaved] = useState(false);

  const pendingStep = invoice?.approvalChain?.find((s) => s.status === "pending");
  const userCanApprove =
    invoice?.status === "pending_approval" &&
    pendingStep &&
    (user?.role === "admin" || user?.role === pendingStep.role);

  const load = useCallback(async () => {
    const data = await getById(id);
    setInvoice(data);
  }, [getById, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(payload) {
    setSaved(false);
    const updated = await update(id, payload);
    setInvoice(updated);
    setSaved(true);
  }

  if (loading && !invoice) {
    return <p className="text-sm text-slate-600">Loading invoice…</p>;
  }

  if (!invoice && !loading) {
    return (
      <div>
        <p className="text-slate-600">Invoice not found.</p>
        <Link href="/invoices" className="mt-2 inline-block text-sm font-medium underline">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/invoices" className="text-sm text-slate-600 hover:text-slate-900">
          ← Invoices
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">
            {invoice.invoiceNumber || "Invoice"}
          </h1>
          <InvoiceStatusBadge status={invoice.status} />
          <MatchStatusBadge
            status={invoice.matchStatus}
            matchType={invoice.matchType}
          />
          <OcrMethodBadge
            method={invoice.ocrMethod}
            aiEnhanced={invoice.aiEnhanced}
            requiresManualReview={invoice.requiresManualReview}
            confidence={invoice.ocrConfidence}
          />
        </div>
        {invoice.uploadedFile?.originalName && (
          <p className="mt-1 text-sm text-slate-600 flex flex-wrap items-center gap-2">
            <span>
              File: {invoice.uploadedFile.originalName}{" "}
              <a
                href={`/api/invoices/${invoice.id}/file`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-900 underline"
              >
                View
              </a>
            </span>
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                const updated = await reocr(id);
                setInvoice(updated);
              }}
              className="text-sm font-medium text-violet-700 hover:underline disabled:opacity-50"
            >
              Re-run OCR
            </button>
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
          Saved successfully.
        </p>
      )}

      <ValidationPanel
        errors={invoice.validationErrors}
        warnings={invoice.validationWarnings}
      />

      <MatchPanel
        invoice={invoice}
        matching={loading}
        onRunMatch={async () => {
          const updated = await runMatch(id);
          setInvoice(updated);
        }}
      />

      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Approval</h2>
          {invoice.status === "validated" && (
            <button
              type="button"
              disabled={approvalLoading}
              onClick={async () => {
                const updated = await submitForApproval(id);
                setInvoice(updated);
              }}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Submit for approval
            </button>
          )}
        </div>
        <ApprovalChain chain={invoice.approvalChain} />
        {userCanApprove && (
          <ApprovalActions
            invoiceId={id}
            disabled={approvalLoading}
            onComplete={async (invoiceId, action, remarks) => {
              const updated = await approve(invoiceId, action, remarks);
              setInvoice(updated);
            }}
          />
        )}
        {(invoice.status === "approved" || invoice.status === "paid") && (
          <InvoicePaymentCard
            invoiceId={invoice.id}
            invoiceStatus={invoice.status}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OCRResultEditor
          invoice={invoice}
          onSave={handleSave}
          saving={loading}
        />

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">Raw OCR text</h2>
          <pre className="text-xs text-slate-700 whitespace-pre-wrap max-h-[480px] overflow-auto font-mono">
            {invoice.rawOcrText || "No OCR text available."}
          </pre>
        </div>
      </div>

    </div>
  );
}
