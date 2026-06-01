"use client";

import Link from "next/link";
import { useEffect } from "react";
import StatsCard from "@/components/dashboard/StatsCard";
import InvoiceAgingChart from "@/components/dashboard/InvoiceAgingChart";
import VendorAnalyticsChart from "@/components/dashboard/VendorAnalyticsChart";
import StatusBreakdown from "@/components/dashboard/StatusBreakdown";
import { useDashboard } from "@/hooks/useDashboard";

function formatInr(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export default function DashboardPage() {
  const { stats, fetchStats, loading, error } = useDashboard();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const s = stats?.summary;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-slate-600">AP overview - payables, aging, and vendors.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link
            href="/invoices/upload"
            className="rounded-md bg-slate-900 px-3 py-2 font-medium text-white hover:bg-slate-800"
          >
            Upload invoice
          </Link>
          <Link
            href="/approvals"
            className="rounded-md border border-slate-300 px-3 py-2 font-medium hover:bg-slate-50"
          >
            Approvals
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {loading && !stats ? (
        <p className="text-sm text-slate-600">Loading dashboard…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              label="Outstanding AP"
              value={formatInr(s?.outstandingAmount)}
              subtext={`${s?.totalInvoices || 0} total invoices`}
            />
            <StatsCard
              label="Pending approval"
              value={s?.pendingApproval ?? 0}
              subtext="Awaiting approvers"
              accent="amber"
            />
            <StatsCard
              label="Payments pending"
              value={s?.pendingPayments ?? 0}
              subtext={formatInr(s?.pendingPaymentAmount)}
              accent="blue"
            />
            <StatsCard
              label="Overdue"
              value={s?.overdueCount ?? 0}
              subtext={formatInr(s?.overdueAmount)}
              accent={s?.overdueCount ? "red" : "default"}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              label="Paid (YTD-style)"
              value={formatInr(s?.paidAmount)}
              subtext={`${s?.paidInvoices || 0} invoices`}
              accent="emerald"
            />
            <StatsCard
              label="Match exceptions"
              value={s?.matchExceptions ?? 0}
              subtext="Needs PO/GRN review"
              accent={s?.matchExceptions ? "red" : "default"}
            />
            <StatsCard
              label="Active vendors"
              value={s?.activeVendors ?? 0}
              subtext={`${s?.totalVendors || 0} total`}
            />
            <StatsCard
              label="Open pipeline"
              value={
                (stats?.invoicesByStatus || [])
                  .filter((i) =>
                    ["uploaded", "validated", "pending_approval"].includes(
                      i.status
                    )
                  )
                  .reduce((n, i) => n + i.count, 0)
              }
              subtext="Pre-approval"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Invoice aging (open payables)
              </h2>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                By days since due / invoice date
              </p>
              <InvoiceAgingChart data={stats?.aging} />
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Top vendors by spend
              </h2>
              <p className="text-sm text-slate-500 mt-1 mb-4">
                All-time invoice totals
              </p>
              <VendorAnalyticsChart data={stats?.vendorAnalytics} />
            </section>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-6 max-w-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Invoices by status
            </h2>
            <StatusBreakdown items={stats?.invoicesByStatus} />
          </section>
        </>
      )}
    </div>
  );
}
