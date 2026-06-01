import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import Vendor from "@/models/Vendor";

const OPEN_STATUSES = [
  "uploaded",
  "ocr_processing",
  "validated",
  "pending_approval",
  "approved",
];

function daysBetween(from, to = new Date()) {
  const ms = to.getTime() - new Date(from).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function agingBucket(days) {
  if (days <= 30) return "0-30 days";
  if (days <= 60) return "31-60 days";
  if (days <= 90) return "61-90 days";
  return "90+ days";
}

export async function getDashboardStats() {
  const [
    statusGroups,
    openInvoices,
    paymentStats,
    vendorCounts,
    matchExceptions,
    vendorSpend,
  ] = await Promise.all([
    Invoice.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ["$extractedData.total", 0] } },
        },
      },
    ]),
    Invoice.find({
      status: { $in: OPEN_STATUSES },
    })
      .select("extractedData status matchStatus createdAt")
      .lean(),
    Payment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]),
    Vendor.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Invoice.countDocuments({ matchStatus: "exception" }),
    Invoice.aggregate([
      { $match: { vendorId: { $ne: null } } },
      {
        $group: {
          _id: "$vendorId",
          invoiceCount: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ["$extractedData.total", 0] } },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: "vendors",
          localField: "_id",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
    ]),
  ]);

  const statusMap = Object.fromEntries(
    statusGroups.map((s) => [s._id, { count: s.count, amount: s.amount }])
  );

  const paymentMap = Object.fromEntries(
    paymentStats.map((p) => [p._id, { count: p.count, amount: p.amount }])
  );

  const vendorMap = Object.fromEntries(
    vendorCounts.map((v) => [v._id, v.count])
  );

  const agingBuckets = {
    "0-30 days": { count: 0, amount: 0 },
    "31-60 days": { count: 0, amount: 0 },
    "61-90 days": { count: 0, amount: 0 },
    "90+ days": { count: 0, amount: 0 },
  };

  let overdueCount = 0;
  let overdueAmount = 0;
  const now = new Date();

  for (const inv of openInvoices) {
    const total = inv.extractedData?.total || 0;
    const anchor =
      inv.extractedData?.dueDate ||
      inv.extractedData?.invoiceDate ||
      inv.createdAt;
    const days = daysBetween(anchor);
    const bucket = agingBucket(days);
    agingBuckets[bucket].count += 1;
    agingBuckets[bucket].amount += total;

    if (inv.extractedData?.dueDate && new Date(inv.extractedData.dueDate) < now) {
      overdueCount += 1;
      overdueAmount += total;
    }
  }

  const aging = Object.entries(agingBuckets).map(([label, data]) => ({
    label,
    count: data.count,
    amount: Math.round(data.amount),
  }));

  const vendorAnalytics = vendorSpend.map((row) => ({
    vendorId: row._id?.toString(),
    name: row.vendor?.name || "Unknown",
    vendorCode: row.vendor?.vendorCode,
    invoiceCount: row.invoiceCount,
    totalAmount: Math.round(row.totalAmount),
  }));

  const totalInvoices = statusGroups.reduce((s, g) => s + g.count, 0);
  const pendingApproval = statusMap.pending_approval?.count || 0;
  const pendingPayments = paymentMap.pending?.count || 0;
  const pendingPaymentAmount = Math.round(paymentMap.pending?.amount || 0);

  const outstandingAmount = openInvoices.reduce(
    (s, inv) => s + (inv.extractedData?.total || 0),
    0
  );

  return {
    summary: {
      totalInvoices,
      pendingApproval,
      pendingPayments,
      pendingPaymentAmount,
      outstandingAmount: Math.round(outstandingAmount),
      overdueCount,
      overdueAmount: Math.round(overdueAmount),
      matchExceptions,
      totalVendors: Object.values(vendorMap).reduce((a, b) => a + b, 0),
      activeVendors: vendorMap.active || 0,
      paidInvoices: statusMap.paid?.count || 0,
      paidAmount: Math.round(statusMap.paid?.amount || 0),
    },
    invoicesByStatus: statusGroups.map((s) => ({
      status: s._id,
      count: s.count,
      amount: Math.round(s.amount),
    })),
    paymentsByStatus: paymentStats.map((p) => ({
      status: p._id,
      count: p.count,
      amount: Math.round(p.amount),
    })),
    aging,
    vendorAnalytics,
  };
}
