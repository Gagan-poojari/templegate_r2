"use client";

import Link from "next/link";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import MatchStatusBadge from "./MatchStatusBadge";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function formatAmount(invoice) {
  const total = invoice.extractedData?.total;
  if (total == null) return "-";
  const currency = invoice.extractedData?.currency || "INR";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(total);
}

export default function InvoiceTable({ invoices }) {
  if (!invoices?.length) {
    return (
      <p className="text-sm text-slate-600 py-8 text-center border border-dashed border-slate-200 rounded-lg">
        No invoices yet.{" "}
        <Link href="/invoices/upload" className="font-medium text-slate-900 underline">
          Upload one
        </Link>
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">Invoice #</th>
            <th className="px-4 py-3 font-medium">Vendor</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Match</th>
            <th className="px-4 py-3 font-medium">Uploaded</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">
                {inv.invoiceNumber || "-"}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {inv.vendor?.name || "-"}
              </td>
              <td className="px-4 py-3 text-slate-700">{formatAmount(inv)}</td>
              <td className="px-4 py-3">
                <InvoiceStatusBadge status={inv.status} />
              </td>
              <td className="px-4 py-3">
                <MatchStatusBadge
                  status={inv.matchStatus}
                  matchType={inv.matchType}
                />
              </td>
              <td className="px-4 py-3 text-slate-600">
                {formatDate(inv.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/invoices/${inv.id}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
