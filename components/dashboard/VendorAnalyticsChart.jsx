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

export default function VendorAnalyticsChart({ data }) {
  if (!data?.length) {
    return (
      <p className="text-sm text-slate-500 py-12 text-center">
        No vendor spend data yet.
      </p>
    );
  }

  const chartData = data.map((v) => ({
    name: v.vendorCode || v.name?.slice(0, 12) || "Vendor",
    totalAmount: v.totalAmount,
    invoiceCount: v.invoiceCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={formatInr} />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(value, name) => [
            name === "totalAmount" ? formatInr(value) : value,
            name === "totalAmount" ? "Spend" : "Invoices",
          ]}
        />
        <Bar
          dataKey="totalAmount"
          fill="#334155"
          name="totalAmount"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
