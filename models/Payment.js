import mongoose from "mongoose";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/types";

const paymentSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date },
    method: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "bank_transfer",
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
    },
    referenceNo: { type: String, trim: true },
    adviceSent: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

paymentSchema.index({ invoiceId: 1 });
paymentSchema.index({ vendorId: 1, status: 1 });

export default mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);
