"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import PaymentStatusBadge from "@/components/payments/PaymentStatusBadge";
import PaymentActions from "@/components/payments/PaymentActions";
import { usePayments } from "@/hooks/usePayments";

function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

export default function PaymentDetailPage() {
  const { id } = useParams();
  const { getById, update, loading, error } = usePayments();
  const [payment, setPayment] = useState(null);

  const load = useCallback(async () => {
    const data = await getById(id);
    setPayment(data);
  }, [getById, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpdate(payload) {
    const updated = await update(id, payload);
    setPayment(updated);
  }

  if (loading && !payment) {
    return <p className="text-sm text-slate-600">Loading…</p>;
  }

  if (!payment) {
    return (
      <div>
        <p className="text-slate-600">Payment not found.</p>
        <Link href="/payments" className="mt-2 inline-block text-sm underline">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/payments" className="text-sm text-slate-600 hover:text-slate-900">
          ← Payments
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">
            {formatMoney(payment.amount)}
          </h1>
          <PaymentStatusBadge status={payment.status} />
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Invoice{" "}
          <Link
            href={`/invoices/${payment.invoiceId}`}
            className="font-medium text-slate-900 underline"
          >
            {payment.invoice?.invoiceNumber || payment.invoiceId}
          </Link>
          {" · "}
          {payment.vendor?.name}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-3 text-sm rounded-lg border border-slate-200 p-4">
        <div>
          <dt className="text-slate-500">Method</dt>
          <dd className="font-medium capitalize">
            {payment.method?.replace(/_/g, " ")}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Reference</dt>
          <dd className="font-medium">{payment.referenceNo || "-"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Payment date</dt>
          <dd className="font-medium">
            {payment.paymentDate
              ? new Date(payment.paymentDate).toLocaleDateString()
              : "-"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Advice sent</dt>
          <dd className="font-medium">{payment.adviceSent ? "Yes" : "No"}</dd>
        </div>
      </dl>

      <PaymentActions
        payment={payment}
        onUpdate={handleUpdate}
        saving={loading}
      />
    </div>
  );
}
