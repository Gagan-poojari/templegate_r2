"use client";

import { useEffect, useState } from "react";
import VendorSelect from "./VendorSelect";
import OcrMethodBadge from "./OcrMethodBadge";

function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function OCRResultEditor({ invoice, onSave, saving }) {
  const [form, setForm] = useState({
    invoiceNumber: "",
    poNumber: "",
    grnNumber: "",
    invoiceDate: "",
    dueDate: "",
    subtotal: "",
    tax: "",
    total: "",
    currency: "INR",
    gstin: "",
    pan: "",
    vendorId: "",
  });

  useEffect(() => {
    if (!invoice) return;
    const ex = invoice.extractedData || {};
    setForm({
      invoiceNumber: invoice.invoiceNumber || "",
      poNumber: invoice.poNumber || "",
      grnNumber: invoice.grnNumber || "",
      invoiceDate: toDateInput(ex.invoiceDate),
      dueDate: toDateInput(ex.dueDate),
      subtotal: ex.subtotal ?? "",
      tax: ex.tax ?? "",
      total: ex.total ?? "",
      currency: ex.currency || "INR",
      gstin: ex.gstin || "",
      pan: ex.pan || "",
      vendorId: invoice.vendorId || "",
    });
  }, [invoice]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave?.({
      invoiceNumber: form.invoiceNumber,
      poNumber: form.poNumber,
      grnNumber: form.grnNumber,
      vendorId: form.vendorId || null,
      extractedData: {
        invoiceDate: form.invoiceDate || null,
        dueDate: form.dueDate || null,
        subtotal: form.subtotal === "" ? null : Number(form.subtotal),
        tax: form.tax === "" ? null : Number(form.tax),
        total: form.total === "" ? null : Number(form.total),
        currency: form.currency,
        gstin: form.gstin?.trim() || null,
        pan: form.pan?.trim() || null,
        lineItems: invoice?.extractedData?.lineItems || [],
      },
      markValidated: true,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Review extracted data</h2>
        <OcrMethodBadge
          method={invoice?.ocrMethod}
          aiEnhanced={invoice?.aiEnhanced}
          requiresManualReview={invoice?.requiresManualReview}
          confidence={invoice?.ocrConfidence}
        />
      </div>
      {invoice?.ocrConfidence != null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Confidence</span>
            <span>{invoice.ocrConfidence}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                invoice.ocrConfidence >= 85
                  ? "bg-emerald-500"
                  : invoice.ocrConfidence >= 60
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, invoice.ocrConfidence)}%` }}
            />
          </div>
        </div>
      )}

      <VendorSelect
        value={form.vendorId}
        onChange={(v) => handleChange("vendorId", v)}
        disabled={saving}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Invoice number" value={form.invoiceNumber} onChange={(v) => handleChange("invoiceNumber", v)} />
        <Field label="PO number" value={form.poNumber} onChange={(v) => handleChange("poNumber", v)} />
        <Field label="GRN number (3-way)" value={form.grnNumber} onChange={(v) => handleChange("grnNumber", v)} />
        <Field label="Invoice date" type="date" value={form.invoiceDate} onChange={(v) => handleChange("invoiceDate", v)} />
        <Field label="Due date" type="date" value={form.dueDate} onChange={(v) => handleChange("dueDate", v)} />
        <Field label="Subtotal" type="number" value={form.subtotal} onChange={(v) => handleChange("subtotal", v)} />
        <Field label="Tax" type="number" value={form.tax} onChange={(v) => handleChange("tax", v)} />
        <Field label="Total" type="number" value={form.total} onChange={(v) => handleChange("total", v)} />
        <Field label="Currency" value={form.currency} onChange={(v) => handleChange("currency", v)} />
        <Field label="GSTIN" value={form.gstin} onChange={(v) => handleChange("gstin", v)} />
        <Field label="PAN" value={form.pan} onChange={(v) => handleChange("pan", v)} />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save & validate"}
      </button>
    </form>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
