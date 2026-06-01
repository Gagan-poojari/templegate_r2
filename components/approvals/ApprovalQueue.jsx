"use client";

import Link from "next/link";
import ApprovalActions from "./ApprovalActions";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";

function formatAmount(invoice) {
  const total = invoice.extractedData?.total;
  if (total == null) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: invoice.extractedData?.currency || "INR",
  }).format(total);
}

export default function ApprovalQueue({ items, onAction, acting }) {
  if (!items?.length) {
    return (
      <p className="text-sm text-slate-600 py-8 text-center border border-dashed border-slate-200 rounded-lg">
        No invoices awaiting your approval.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((inv) => (
        <article
          key={inv.id}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href={`/invoices/${inv.id}`}
                className="text-lg font-semibold text-slate-900 hover:underline"
              >
                {inv.invoiceNumber || "Invoice"}
              </Link>
              <p className="text-sm text-slate-600 mt-1">
                {inv.vendor?.name || "-"} · {formatAmount(inv)}
              </p>
              {inv.currentStep && (
                <p className="text-xs text-slate-500 mt-1">
                  Your step: <strong>{inv.currentStep.role}</strong>
                  {inv.currentStep.status === "escalated" && " (escalated)"}
                </p>
              )}
            </div>
            <InvoiceStatusBadge status={inv.status} />
          </div>

          {inv.canAct && (
            <div className="mt-4">
              <ApprovalActions
                invoiceId={inv.id}
                onComplete={onAction}
                disabled={acting}
              />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
