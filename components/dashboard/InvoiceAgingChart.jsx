"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatInr(value) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
  return `₹${value}`;
}

export default function InvoiceAgingChart({ data }) {
  if (!data?.length) {
    return (
      <p className="text-sm text-slate-500 py-12 text-center">No open invoice aging data.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={formatInr} />
        <Tooltip
          formatter={(value, name) => [
            name === "amount" ? formatInr(value) : value,
            name === "amount" ? "Amount" : "Invoices",
          ]}
        />
        <Bar dataKey="amount" fill="#0f172a" name="amount" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
