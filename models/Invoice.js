import mongoose from "mongoose";
import {
  INVOICE_STATUSES,
  MATCH_TYPES,
  MATCH_STATUSES,
  APPROVAL_STATUSES,
} from "@/types";

const lineItemSchema = new mongoose.Schema(
  {
    description: String,
    quantity: Number,
    unitPrice: Number,
    amount: Number,
    hsnCode: String,
    taxRate: Number,
  },
  { _id: true }
);

const extractedDataSchema = new mongoose.Schema(
  {
    invoiceDate: Date,
    dueDate: Date,
    lineItems: [lineItemSchema],
    subtotal: Number,
    tax: Number,
    total: Number,
    currency: { type: String, default: "INR" },
    gstin: { type: String, trim: true, uppercase: true },
    pan: { type: String, trim: true, uppercase: true },
  },
  { _id: false }
);

const approvalStepSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: String,
    status: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: "pending",
    },
    activatedAt: Date,
    escalationAfterHours: { type: Number, default: 48 },
    timestamp: Date,
    remarks: String,
  },
  { _id: true }
);

const uploadedFileSchema = new mongoose.Schema(
  {
    path: String,
    originalName: String,
    mimeType: String,
  },
  { _id: false }
);

const matchLineSchema = new mongoose.Schema(
  {
    description: String,
    invoiceQty: Number,
    poQty: Number,
    grnReceivedQty: Number,
    invoiceAmount: Number,
    poAmount: Number,
    grnValue: Number,
    status: {
      type: String,
      enum: ["matched", "partial", "exception", "unmatched"],
    },
    message: String,
  },
  { _id: true }
);

const matchDetailsSchema = new mongoose.Schema(
  {
    poId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },
    grnId: { type: mongoose.Schema.Types.ObjectId, ref: "GRN" },
    poNumber: String,
    grnNumber: String,
    poTotal: Number,
    grnValue: Number,
    invoiceTotal: Number,
    headerVariance: Number,
    headerMatch: Boolean,
    lineMatches: [matchLineSchema],
    lineSummary: {
      matched: Number,
      partial: Number,
      exception: Number,
      unmatched: Number,
      total: Number,
    },
    exceptions: [String],
    matchedAt: Date,
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, trim: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    poNumber: { type: String, trim: true },
    grnNumber: { type: String, trim: true },
    status: {
      type: String,
      enum: INVOICE_STATUSES,
      default: "uploaded",
    },
    extractedData: extractedDataSchema,
    ocrConfidence: { type: Number, min: 0, max: 100 },
    ocrMethod: {
      type: String,
      enum: ["tesseract", "gemini", "tesseract_fallback", "pdf_text"],
    },
    aiEnhanced: { type: Boolean, default: false },
    requiresManualReview: { type: Boolean, default: false },
    matchType: { type: String, enum: MATCH_TYPES },
    matchStatus: {
      type: String,
      enum: MATCH_STATUSES,
      default: "unmatched",
    },
    matchDetails: matchDetailsSchema,
    approvalChain: [approvalStepSchema],
    uploadedFile: uploadedFileSchema,
    rawOcrText: String,
    validationErrors: [String],
    validationWarnings: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

invoiceSchema.index({ invoiceNumber: 1, vendorId: 1 });
invoiceSchema.index({ status: 1, createdAt: -1 });
invoiceSchema.index({ vendorId: 1 });
invoiceSchema.index({ poNumber: 1 });

export default mongoose.models.Invoice ||
  mongoose.model("Invoice", invoiceSchema);
