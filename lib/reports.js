import Invoice from "@/models/Invoice";

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
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

export async function getApAgingReport() {
  const invoices = await Invoice.find({ status: { $in: OPEN_STATUSES } })
    .populate("vendorId", "name vendorCode gstin")
    .sort({ "extractedData.dueDate": 1 })
    .lean();

  const rows = invoices.map((inv) => {
    const anchor =
      inv.extractedData?.dueDate ||
      inv.extractedData?.invoiceDate ||
      inv.createdAt;
    const days = daysBetween(anchor);
    const vendor = inv.vendorId;
    return {
      invoiceId: inv._id.toString(),
      invoiceNumber: inv.invoiceNumber,
      vendorName:
        vendor && typeof vendor === "object" ? vendor.name : undefined,
      vendorCode:
        vendor && typeof vendor === "object" ? vendor.vendorCode : undefined,
      status: inv.status,
      amount: inv.extractedData?.total || 0,
      subtotal: inv.extractedData?.subtotal,
      tax: inv.extractedData?.tax,
      dueDate: inv.extractedData?.dueDate,
      invoiceDate: inv.extractedData?.invoiceDate,
      daysOpen: days,
      bucket: agingBucket(days),
      isOverdue:
        inv.extractedData?.dueDate &&
        new Date(inv.extractedData.dueDate) < new Date(),
    };
  });

  const summary = rows.reduce(
    (acc, row) => {
      acc.totalAmount += row.amount;
      acc.byBucket[row.bucket] = acc.byBucket[row.bucket] || {
        count: 0,
        amount: 0,
      };
      acc.byBucket[row.bucket].count += 1;
      acc.byBucket[row.bucket].amount += row.amount;
      if (row.isOverdue) {
        acc.overdueCount += 1;
        acc.overdueAmount += row.amount;
      }
      return acc;
    },
    {
      count: rows.length,
      totalAmount: 0,
      overdueCount: 0,
      overdueAmount: 0,
      byBucket: {},
    }
  );

  return { rows, summary };
}

export async function getGstReport() {
  const invoices = await Invoice.find({
    $or: [
      { "extractedData.gstin": { $exists: true, $ne: "" } },
      { "extractedData.tax": { $gt: 0 } },
    ],
  })
    .populate("vendorId", "name gstin")
    .lean();

  const byGstin = {};

  for (const inv of invoices) {
    const vendor = inv.vendorId;
    const gstin =
      inv.extractedData?.gstin ||
      (vendor && typeof vendor === "object" ? vendor.gstin : null) ||
      "UNREGISTERED";
    const key = gstin.toUpperCase();

    if (!byGstin[key]) {
      byGstin[key] = {
        gstin: key,
        vendorName:
          vendor && typeof vendor === "object" ? vendor.name : undefined,
        invoiceCount: 0,
        taxableValue: 0,
        taxAmount: 0,
        totalAmount: 0,
      };
    }

    byGstin[key].invoiceCount += 1;
    byGstin[key].taxableValue += inv.extractedData?.subtotal || 0;
    byGstin[key].taxAmount += inv.extractedData?.tax || 0;
    byGstin[key].totalAmount += inv.extractedData?.total || 0;
  }

  const rows = Object.values(byGstin)
    .map((r) => ({
      ...r,
      taxableValue: Math.round(r.taxableValue),
      taxAmount: Math.round(r.taxAmount),
      totalAmount: Math.round(r.totalAmount),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const totals = rows.reduce(
    (acc, r) => {
      acc.invoiceCount += r.invoiceCount;
      acc.taxableValue += r.taxableValue;
      acc.taxAmount += r.taxAmount;
      acc.totalAmount += r.totalAmount;
      return acc;
    },
    { invoiceCount: 0, taxableValue: 0, taxAmount: 0, totalAmount: 0 }
  );

  return { rows, totals };
}

export async function getExceptionsReport() {
  const [validationIssues, matchExceptions, rejected] = await Promise.all([
    Invoice.find({
      $or: [
        { validationErrors: { $exists: true, $not: { $size: 0 } } },
        { validationWarnings: { $exists: true, $not: { $size: 0 } } },
      ],
    })
      .select(
        "invoiceNumber status validationErrors validationWarnings vendorId createdAt"
      )
      .populate("vendorId", "name")
      .lean(),
    Invoice.find({ matchStatus: { $in: ["exception", "unmatched", "partial"] } })
      .select("invoiceNumber status matchStatus matchType poNumber matchDetails")
      .populate("vendorId", "name")
      .lean(),
    Invoice.find({ status: "rejected" })
      .select("invoiceNumber approvalChain vendorId updatedAt")
      .populate("vendorId", "name")
      .lean(),
  ]);

  const validation = validationIssues.map((inv) => ({
    type: "validation",
    invoiceId: inv._id.toString(),
    invoiceNumber: inv.invoiceNumber,
    vendorName: inv.vendorId?.name,
    status: inv.status,
    errors: inv.validationErrors || [],
    warnings: inv.validationWarnings || [],
    createdAt: inv.createdAt,
  }));

  const matching = matchExceptions.map((inv) => ({
    type: "matching",
    invoiceId: inv._id.toString(),
    invoiceNumber: inv.invoiceNumber,
    vendorName: inv.vendorId?.name,
    status: inv.status,
    matchStatus: inv.matchStatus,
    matchType: inv.matchType,
    poNumber: inv.poNumber,
    exceptions: inv.matchDetails?.exceptions || [],
  }));

  const rejections = rejected.map((inv) => {
    const rejectedStep = inv.approvalChain?.find((s) => s.status === "rejected");
    return {
      type: "rejected",
      invoiceId: inv._id.toString(),
      invoiceNumber: inv.invoiceNumber,
      vendorName: inv.vendorId?.name,
      remarks: rejectedStep?.remarks,
      rejectedAt: rejectedStep?.timestamp || inv.updatedAt,
    };
  });

  return {
    validation,
    matching,
    rejections,
    summary: {
      validationCount: validation.length,
      matchingCount: matching.length,
      rejectionCount: rejections.length,
      total:
        validation.length + matching.length + rejections.length,
    },
  };
}

export async function getFullReports() {
  const [apAging, gst, exceptions] = await Promise.all([
    getApAgingReport(),
    getGstReport(),
    getExceptionsReport(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    apAging,
    gst,
    exceptions,
  };
}
