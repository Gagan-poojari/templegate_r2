"use client";

import { useState } from "react";
import { PAYMENT_METHODS } from "@/types";

export default function PaymentActions({ payment, onUpdate, saving }) {
  const [referenceNo, setReferenceNo] = useState(payment?.referenceNo || "");
  const [method, setMethod] = useState(payment?.method || "bank_transfer");
  const [paymentDate, setPaymentDate] = useState(
    payment?.paymentDate
      ? new Date(payment.paymentDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );

  if (!payment) return null;

  const isPending = payment.status === "pending";

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Process payment</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Payment method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            disabled={!isPending || saving}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reference / UTR
          </label>
          <input
            type="text"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            disabled={!isPending || saving}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="NEFT/UTR reference"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Payment date
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            disabled={!isPending || saving}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {isPending && (
          <>
            <button
              type="button"
              disabled={saving || !referenceNo.trim()}
              onClick={() =>
                onUpdate({
                  status: "processed",
                  method,
                  referenceNo: referenceNo.trim(),
                  paymentDate,
                  sendAdvice: true,
                })
              }
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              Mark processed & send advice
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => onUpdate({ status: "failed", referenceNo })}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Mark failed
            </button>
          </>
        )}
        {payment.status === "processed" && !payment.adviceSent && (
          <button
            type="button"
            disabled={saving}
            onClick={() => onUpdate({ sendAdvice: true })}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-white disabled:opacity-50"
          >
            Resend payment advice
          </button>
        )}
      </div>

      {payment.adviceSent && (
        <p className="text-xs text-emerald-700">Payment advice email sent.</p>
      )}
    </div>
  );
}
