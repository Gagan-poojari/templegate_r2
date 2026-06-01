"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import VendorTable from "@/components/vendors/VendorTable";
import { useVendors } from "@/hooks/useVendors";
import { useAuth } from "@/hooks/useAuth";
import { VENDOR_STATUSES } from "@/types";

export default function VendorsPage() {
  const { list, remove, loading, error } = useVendors();
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const params = {};
    if (q.trim()) params.q = q.trim();
    if (status) params.status = status;
    const data = await list(params);
    setVendors(data.vendors);
  }, [list, q, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id) {
    if (!confirm("Delete this vendor?")) return;
    await remove(id);
    await load();
  }

  const canDelete = user?.role === "admin" || user?.role === "vendor_manager";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendors</h1>
          <p className="mt-1 text-slate-600">Manage vendors and onboarding.</p>
        </div>
        <Link
          href="/vendors/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add vendor
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search name, code, GSTIN"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm min-w-[220px]"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {VENDOR_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        {loading && !vendors.length ? (
          <p className="text-sm text-slate-600">Loading…</p>
        ) : (
          <VendorTable
            vendors={vendors}
            onDelete={canDelete ? handleDelete : undefined}
          />
        )}
      </div>
    </div>
  );
}
