"use client";

import MatchStatusBadge from "./MatchStatusBadge";

export default function MatchPanel({ invoice, onRunMatch, matching }) {
  const details = invoice?.matchDetails;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">PO matching</h2>
          <p className="text-sm text-slate-600 mt-1">
            {invoice?.poNumber
              ? `PO: ${invoice.poNumber}${invoice.grnNumber ? ` · GRN: ${invoice.grnNumber}` : ""}`
              : "Add a PO number to run 2-way or 3-way matching."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MatchStatusBadge
            status={invoice?.matchStatus}
            matchType={invoice?.matchType}
          />
          {invoice?.poNumber && (
            <button
              type="button"
              onClick={onRunMatch}
              disabled={matching}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {matching ? "Matching…" : "Run match"}
            </button>
          )}
        </div>
      </div>

      {!details && invoice?.poNumber && (
        <p className="text-sm text-slate-600">
          Save & validate or click Run match to compare against the purchase order.
        </p>
      )}

      {details && (
        <>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <Stat label="Invoice total" value={formatMoney(details.invoiceTotal)} />
            <Stat label="PO total" value={formatMoney(details.poTotal)} />
            {details.grnValue != null && (
              <Stat label="GRN value" value={formatMoney(details.grnValue)} />
            )}
          </div>

          {details.headerVariance != null && (
            <p className="text-sm text-slate-600">
              Header variance:{" "}
              <strong className={details.headerMatch ? "text-emerald-700" : "text-red-700"}>
                {details.headerVariance.toFixed(2)}
              </strong>
              {details.headerMatch ? " (within tolerance)" : ""}
            </p>
          )}

          {details.exceptions?.length > 0 && (
            <ul className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-md px-4 py-3 list-disc pl-6">
              {details.exceptions.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}

          {details.lineMatches?.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Line</th>
                    <th className="px-3 py-2 text-right">Inv amt</th>
                    <th className="px-3 py-2 text-right">PO amt</th>
                    <th className="px-3 py-2 text-right">GRN qty</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {details.lineMatches.map((line, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{line.description}</td>
                      <td className="px-3 py-2 text-right">{formatMoney(line.invoiceAmount)}</td>
                      <td className="px-3 py-2 text-right">{formatMoney(line.poAmount)}</td>
                      <td className="px-3 py-2 text-right">{line.grnReceivedQty ?? "-"}</td>
                      <td className="px-3 py-2 capitalize">{line.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {details.lineSummary && (
            <p className="text-xs text-slate-500">
              Lines: {details.lineSummary.matched} matched, {details.lineSummary.partial}{" "}
              partial, {details.lineSummary.exception} exception
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatMoney(n) {
  if (n == null) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}
