"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import VendorForm from "@/components/vendors/VendorForm";
import { useVendors } from "@/hooks/useVendors";

export default function NewVendorPage() {
  const router = useRouter();
  const { create, loading, error } = useVendors();

  async function handleSubmit(form) {
    const vendor = await create(form);
    router.push(`/vendors/${vendor.id}`);
  }

  return (
    <div>
      <Link href="/vendors" className="text-sm text-slate-600 hover:text-slate-900">
        ← Vendors
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Add vendor</h1>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="mt-6">
        <VendorForm onSubmit={handleSubmit} saving={loading} submitLabel="Create vendor" />
      </div>
    </div>
  );
}
