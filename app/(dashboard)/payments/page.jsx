"use client";

import { useCallback, useEffect, useState } from "react";
import PaymentTable from "@/components/payments/PaymentTable";
import { usePayments } from "@/hooks/usePayments";
import { PAYMENT_STATUSES } from "@/types";

export default function PaymentsPage() {
  const { list, loading, error } = usePayments();
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const params = {};
    if (status) params.status = status;
    const data = await list(params);
    setPayments(data.payments);
  }, [list, status]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingCount = payments.filter((p) => p.status === "pending").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
      <p className="mt-2 text-slate-600">
        Track payment requests from approved invoices.
        {pendingCount > 0 && (
          <span className="ml-2 font-medium text-amber-700">
            {pendingCount} pending
          </span>
        )}
      </p>

      <div className="mt-6">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        {loading && !payments.length ? (
          <p className="text-sm text-slate-600">Loading…</p>
        ) : (
          <PaymentTable payments={payments} />
        )}
      </div>
    </div>
  );
}
