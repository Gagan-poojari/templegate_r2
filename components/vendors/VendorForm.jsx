"use client";

import { useEffect, useState } from "react";

const empty = {
  vendorCode: "",
  name: "",
  email: "",
  phone: "",
  gstin: "",
  pan: "",
  tin: "",
  bankDetails: {
    accountNo: "",
    ifsc: "",
    bankName: "",
    branch: "",
  },
};

export default function VendorForm({ vendor, onSubmit, saving, submitLabel }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!vendor) {
      setForm(empty);
      return;
    }
    setForm({
      vendorCode: vendor.vendorCode || "",
      name: vendor.name || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      gstin: vendor.gstin || "",
      pan: vendor.pan || "",
      tin: vendor.tin || "",
      bankDetails: {
        accountNo: vendor.bankDetails?.accountNo || "",
        ifsc: vendor.bankDetails?.ifsc || "",
        bankName: vendor.bankDetails?.bankName || "",
        branch: vendor.bankDetails?.branch || "",
      },
    });
  }, [vendor]);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setBank(field, value) {
    setForm((prev) => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: value },
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit?.(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
          Basic info
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vendor code *" value={form.vendorCode} onChange={(v) => setField("vendorCode", v)} />
          <Field label="Name *" value={form.name} onChange={(v) => setField("name", v)} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setField("email", v)} />
          <Field label="Phone" value={form.phone} onChange={(v) => setField("phone", v)} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
          Tax IDs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="GSTIN" value={form.gstin} onChange={(v) => setField("gstin", v)} />
          <Field label="PAN" value={form.pan} onChange={(v) => setField("pan", v)} />
          <Field label="TIN" value={form.tin} onChange={(v) => setField("tin", v)} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
          Bank details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Account number" value={form.bankDetails.accountNo} onChange={(v) => setBank("accountNo", v)} />
          <Field label="IFSC" value={form.bankDetails.ifsc} onChange={(v) => setBank("ifsc", v)} />
          <Field label="Bank name" value={form.bankDetails.bankName} onChange={(v) => setBank("bankName", v)} />
          <Field label="Branch" value={form.bankDetails.branch} onChange={(v) => setBank("branch", v)} />
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? "Saving…" : submitLabel || "Save vendor"}
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
        required={label.includes("*")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
