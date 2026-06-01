"use client";

import { useState } from "react";

export default function ApprovalActions({ invoiceId, onComplete, disabled }) {
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAction(action) {
    setSubmitting(true);
    try {
      await onComplete(invoiceId, action, remarks);
      setRemarks("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <label className="block text-sm font-medium text-slate-700">
        Remarks (optional)
      </label>
      <textarea
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        rows={2}
        disabled={disabled || submitting}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        placeholder="Add a note for audit trail…"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || submitting}
          onClick={() => handleAction("approve")}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={disabled || submitting}
          onClick={() => handleAction("reject")}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
