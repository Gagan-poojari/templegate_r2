"use client";

import Link from "next/link";
import VendorStatusBadge from "./VendorStatusBadge";

export default function VendorTable({ vendors, onDelete }) {
  if (!vendors?.length) {
    return (
      <p className="text-sm text-slate-600 py-8 text-center border border-dashed border-slate-200 rounded-lg">
        No vendors found.{" "}
        <Link href="/vendors/new" className="font-medium text-slate-900 underline">
          Add vendor
        </Link>
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">Code</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">GSTIN</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {vendors.map((v) => (
            <tr key={v.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-slate-900">{v.vendorCode}</td>
              <td className="px-4 py-3">{v.name}</td>
              <td className="px-4 py-3 font-mono text-xs">{v.gstin || "-"}</td>
              <td className="px-4 py-3">
                <VendorStatusBadge
                  status={v.status}
                  onboardingStatus={v.onboardingStatus}
                />
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <Link
                  href={`/vendors/${v.id}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  Edit
                </Link>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(v.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
