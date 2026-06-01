"use client";

import { useEffect, useState } from "react";

export default function VendorSelect({ value, onChange, disabled }) {
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    fetch("/api/vendors?activeOnly=true&limit=100")
      .then((r) => r.json())
      .then((data) => setVendors(data.vendors || []))
      .catch(() => setVendors([]));
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Linked vendor
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">- None -</option>
        {vendors.map((v) => (
          <option key={v.id} value={v.id}>
            {v.vendorCode} - {v.name}
          </option>
        ))}
      </select>
    </div>
  );
}
