"use client";

import { useEffect, useState } from "react";
import ApAgingReport from "@/components/reports/ApAgingReport";
import GstReport from "@/components/reports/GstReport";
import ExceptionsReport from "@/components/reports/ExceptionsReport";
import { useReports } from "@/hooks/useReports";

const TABS = [
  { id: "aging", label: "AP aging" },
  { id: "gst", label: "GST summary" },
  { id: "exceptions", label: "Exceptions" },
];

export default function ReportsPage() {
  const { data, fetchReports, loading, error } = useReports();
  const [tab, setTab] = useState("aging");

  useEffect(() => {
    fetchReports("all");
  }, [fetchReports]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="mt-1 text-slate-600">
          AP aging, GST consolidation, and exception audit.
          {data?.generatedAt && (
            <span className="block text-xs text-slate-400 mt-1">
              Generated {new Date(data.generatedAt).toLocaleString()}
            </span>
          )}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <p className="text-sm text-slate-600">Loading reports…</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          {tab === "aging" && <ApAgingReport report={data?.apAging} />}
          {tab === "gst" && <GstReport report={data?.gst} />}
          {tab === "exceptions" && <ExceptionsReport report={data?.exceptions} />}
        </div>
      )}
    </div>
  );
}
