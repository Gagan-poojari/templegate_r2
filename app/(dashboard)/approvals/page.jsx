"use client";

import { useCallback, useEffect, useState } from "react";
import ApprovalQueue from "@/components/approvals/ApprovalQueue";
import { useApprovals } from "@/hooks/useApprovals";

export default function ApprovalsPage() {
  const { fetchQueue, approve, loading, error } = useApprovals();
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    const data = await fetchQueue();
    setItems(data.approvals || []);
  }, [fetchQueue]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(invoiceId, action, remarks) {
    await approve(invoiceId, action, remarks);
    await load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Approval queue</h1>
      <p className="mt-2 text-slate-600">
        Invoices assigned to your role. Matrix: &lt;₹10k L1 · ₹10k–1L L1+L2 · &gt;₹1L L1+L2+CFO.
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="mt-6">
        {loading && !items.length ? (
          <p className="text-sm text-slate-600">Loading…</p>
        ) : (
          <ApprovalQueue items={items} onAction={handleAction} acting={loading} />
        )}
      </div>
    </div>
  );
}
