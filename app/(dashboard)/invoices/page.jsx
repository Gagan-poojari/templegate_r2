"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import InvoiceTable from "@/components/invoices/InvoiceTable";
import { useInvoices } from "@/hooks/useInvoices";
import { INVOICE_STATUSES } from "@/types";

export default function InvoicesPage() {
  const { list, loading, error } = useInvoices();
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = {};
    if (status) params.status = status;
    if (q.trim()) params.q = q.trim();
    list(params).then((data) => setInvoices(data.invoices));
  }, [list, status, q]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="mt-1 text-slate-600">Upload, OCR, and review payable invoices.</p>
        </div>
        <Link
          href="/invoices/upload"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Upload invoice
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search invoice or PO #"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm min-w-[200px]"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-6">
        {loading && !invoices.length ? (
          <p className="text-sm text-slate-600">Loading…</p>
        ) : (
          <InvoiceTable invoices={invoices} />
        )}
      </div>
    </div>
  );
}
