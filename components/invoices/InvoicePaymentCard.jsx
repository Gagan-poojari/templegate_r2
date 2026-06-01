"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PaymentStatusBadge from "@/components/payments/PaymentStatusBadge";

export default function InvoicePaymentCard({ invoiceId, invoiceStatus }) {
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    if (!invoiceId || !["approved", "paid"].includes(invoiceStatus)) return;
    fetch(`/api/invoices/${invoiceId}/payment`)
      .then((r) => r.json())
      .then((d) => setPayment(d.payment))
      .catch(() => setPayment(null));
  }, [invoiceId, invoiceStatus]);

  if (!["approved", "paid"].includes(invoiceStatus)) return null;
  if (!payment) {
    return (
      <p className="text-sm text-slate-600">
        No payment record yet (created automatically on full approval).
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-900">Payment request</p>
        <p className="text-lg font-semibold">
          {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(payment.amount)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <PaymentStatusBadge status={payment.status} />
        <Link
          href={`/payments/${payment.id}`}
          className="text-sm font-medium text-slate-900 underline"
        >
          Manage payment
        </Link>
      </div>
    </div>
  );
}
