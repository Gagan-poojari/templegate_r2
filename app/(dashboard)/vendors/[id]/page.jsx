"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import VendorForm from "@/components/vendors/VendorForm";
import VendorStatusBadge from "@/components/vendors/VendorStatusBadge";
import OnboardingActions from "@/components/vendors/OnboardingActions";
import { useVendors } from "@/hooks/useVendors";
import { useAuth } from "@/hooks/useAuth";

export default function VendorDetailPage() {
  const { id } = useParams();
  const { getById, update, onboarding, loading, error } = useVendors();
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);

  const load = useCallback(async () => {
    const data = await getById(id);
    setVendor(data);
  }, [getById, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(form) {
    const updated = await update(id, form);
    setVendor(updated);
  }

  async function handleOnboarding(action) {
    const updated = await onboarding(id, action);
    setVendor(updated);
  }

  if (loading && !vendor) {
    return <p className="text-sm text-slate-600">Loading…</p>;
  }

  if (!vendor) {
    return (
      <div>
        <p className="text-slate-600">Vendor not found.</p>
        <Link href="/vendors" className="mt-2 inline-block text-sm underline">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/vendors" className="text-sm text-slate-600 hover:text-slate-900">
          ← Vendors
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{vendor.name}</h1>
          <VendorStatusBadge
            status={vendor.status}
            onboardingStatus={vendor.onboardingStatus}
          />
        </div>
        <p className="text-sm text-slate-500 font-mono">{vendor.vendorCode}</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <OnboardingActions
        vendor={vendor}
        userRole={user?.role}
        loading={loading}
        onAction={handleOnboarding}
      />

      <VendorForm
        vendor={vendor}
        onSubmit={handleSave}
        saving={loading}
        submitLabel="Update vendor"
      />
    </div>
  );
}
