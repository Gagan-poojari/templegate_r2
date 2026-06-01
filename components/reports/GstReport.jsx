"use client";

import { downloadCsv } from "@/lib/export-csv";

function formatInr(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function GstReport({ report }) {
  if (!report) return null;

  const { rows, totals } = report;

  function exportCsv() {
    downloadCsv("gst-summary.csv", rows, [
      { label: "GSTIN", get: (r) => r.gstin },
      { label: "Vendor", get: (r) => r.vendorName },
      { label: "Invoices", get: (r) => r.invoiceCount },
      { label: "Taxable", get: (r) => r.taxableValue },
      { label: "Tax", get: (r) => r.taxAmount },
      { label: "Total", get: (r) => r.totalAmount },
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          {totals.invoiceCount} invoices · Tax {formatInr(totals.taxAmount)} · Total{" "}
          {formatInr(totals.totalAmount)}
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
              <th className="px-3 py-2 text-left">GSTIN</th>
              <th className="px-3 py-2 text-left">Vendor</th>
              <th className="px-3 py-2 text-right">Invoices</th>
              <th className="px-3 py-2 text-right">Taxable</th>
              <th className="px-3 py-2 text-right">GST</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.gstin}>
                <td className="px-3 py-2 font-mono text-xs">{row.gstin}</td>
                <td className="px-3 py-2">{row.vendorName || "-"}</td>
                <td className="px-3 py-2 text-right">{row.invoiceCount}</td>
                <td className="px-3 py-2 text-right">{formatInr(row.taxableValue)}</td>
                <td className="px-3 py-2 text-right">{formatInr(row.taxAmount)}</td>
                <td className="px-3 py-2 text-right">{formatInr(row.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
