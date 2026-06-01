"use client";

import Link from "next/link";
import { downloadCsv } from "@/lib/export-csv";

function formatInr(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function ApAgingReport({ report }) {
  if (!report) return null;

  const { rows, summary } = report;

  function exportCsv() {
    downloadCsv("ap-aging.csv", rows, [
      { label: "Invoice", get: (r) => r.invoiceNumber },
      { label: "Vendor", get: (r) => r.vendorName },
      { label: "Amount", get: (r) => r.amount },
      { label: "Bucket", get: (r) => r.bucket },
      { label: "Days", get: (r) => r.daysOpen },
      { label: "Due Date", get: (r) => r.dueDate },
      { label: "Status", get: (r) => r.status },
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {summary.count} open invoices · {formatInr(summary.totalAmount)} total
          {summary.overdueCount > 0 && (
            <span className="text-red-600 ml-2">
              · {summary.overdueCount} overdue ({formatInr(summary.overdueAmount)})
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!rows.length}
          className="text-sm font-medium text-slate-900 underline disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Invoice</th>
              <th className="px-3 py-2 text-left">Vendor</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Bucket</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.invoiceId} className={row.isOverdue ? "bg-red-50/50" : ""}>
                <td className="px-3 py-2">
                  <Link
                    href={`/invoices/${row.invoiceId}`}
                    className="font-medium hover:underline"
                  >
                    {row.invoiceNumber || "-"}
                  </Link>
                </td>
                <td className="px-3 py-2">{row.vendorName || "-"}</td>
                <td className="px-3 py-2 text-right">{formatInr(row.amount)}</td>
                <td className="px-3 py-2">{row.bucket} days</td>
                <td className="px-3 py-2 capitalize">{row.status?.replace(/_/g, " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
