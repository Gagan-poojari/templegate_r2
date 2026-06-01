"use client";

import Link from "next/link";
import PaymentStatusBadge from "./PaymentStatusBadge";

function formatMoney(amount) {
  if (amount == null) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function PaymentTable({ payments }) {
  if (!payments?.length) {
    return (
      <p className="text-sm text-slate-600 py-8 text-center border border-dashed border-slate-200 rounded-lg">
        No payment requests yet. Payments are created when invoices are fully approved.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">Invoice</th>
            <th className="px-4 py-3 font-medium">Vendor</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Method</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Paid on</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium">
                {p.invoice?.invoiceNumber || "-"}
              </td>
              <td className="px-4 py-3">{p.vendor?.name || "-"}</td>
              <td className="px-4 py-3">{formatMoney(p.amount)}</td>
              <td className="px-4 py-3 capitalize">
                {p.method?.replace(/_/g, " ")}
              </td>
              <td className="px-4 py-3">
                <PaymentStatusBadge status={p.status} />
              </td>
              <td className="px-4 py-3 text-slate-600">
                {formatDate(p.paymentDate)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/payments/${p.id}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  Manage
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
