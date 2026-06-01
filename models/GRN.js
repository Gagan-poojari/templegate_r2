import mongoose from "mongoose";
import { GRN_STATUSES } from "@/types";

const grnLineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    orderedQty: { type: Number, required: true, min: 0 },
    receivedQty: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, min: 0 },
  },
  { _id: true }
);

const grnSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, required: true, unique: true, trim: true },
    poNumber: { type: String, required: true, trim: true },
    poId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    lineItems: [grnLineItemSchema],
    receivedDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: GRN_STATUSES,
      default: "open",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

grnSchema.index({ grnNumber: 1 });
grnSchema.index({ poNumber: 1 });

export default mongoose.models.GRN || mongoose.model("GRN", grnSchema);
