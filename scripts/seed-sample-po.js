/**
 * Seeds a sample vendor, PO, and GRN for matching tests.
 * Usage: node scripts/seed-sample-po.js
 */
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ap-automation";

const vendorSchema = new mongoose.Schema(
  {
    vendorCode: String,
    name: String,
    gstin: String,
    status: String,
  },
  { timestamps: true }
);
const poSchema = new mongoose.Schema(
  {
    poNumber: String,
    vendorId: mongoose.Schema.Types.ObjectId,
    lineItems: Array,
    totalAmount: Number,
    status: String,
  },
  { timestamps: true }
);
const grnSchema = new mongoose.Schema(
  {
    grnNumber: String,
    poNumber: String,
    poId: mongoose.Schema.Types.ObjectId,
    vendorId: mongoose.Schema.Types.ObjectId,
    lineItems: Array,
    status: String,
  },
  { timestamps: true }
);

const Vendor = mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
const PO =
  mongoose.models.PurchaseOrder ||
  mongoose.model("PurchaseOrder", poSchema);
const GRN = mongoose.models.GRN || mongoose.model("GRN", grnSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);

  let vendor = await Vendor.findOne({ vendorCode: "DEMO-001" });
  if (!vendor) {
    vendor = await Vendor.create({
      vendorCode: "DEMO-001",
      name: "Demo Supplies Pvt Ltd",
      gstin: "27AABCU9603R1ZM",
      status: "active",
    });
    console.log("Created vendor:", vendor.vendorCode);
  }

  const poNumber = "PO-2024-1001";
  let po = await PO.findOne({ poNumber });
  if (!po) {
    const lineItems = [
      {
        description: "Office paper A4",
        quantity: 100,
        unitPrice: 250,
        amount: 25000,
      },
      {
        description: "Printer toner",
        quantity: 5,
        unitPrice: 3500,
        amount: 17500,
      },
    ];
    po = await PO.create({
      poNumber,
      vendorId: vendor._id,
      lineItems,
      totalAmount: 42500,
      status: "open",
    });
    console.log("Created PO:", poNumber, "total", po.totalAmount);
  }

  const grnNumber = "GRN-2024-5001";
  let grn = await GRN.findOne({ grnNumber });
  if (!grn) {
    grn = await GRN.create({
      grnNumber,
      poNumber,
      poId: po._id,
      vendorId: vendor._id,
      lineItems: [
        {
          description: "Office paper A4",
          orderedQty: 100,
          receivedQty: 100,
          unitPrice: 250,
        },
        {
          description: "Printer toner",
          orderedQty: 5,
          receivedQty: 5,
          unitPrice: 3500,
        },
      ],
      status: "closed",
    });
    console.log("Created GRN:", grnNumber);
  }

  console.log("\nUse on invoice:");
  console.log("  PO number:", poNumber);
  console.log("  GRN number:", grnNumber);
  console.log("  Vendor ID:", vendor._id.toString());
  console.log("  Line totals should sum to 42500 for a full match");

  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
