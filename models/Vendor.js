import mongoose from "mongoose";
import { VENDOR_STATUSES } from "@/types";

const bankDetailsSchema = new mongoose.Schema(
  {
    accountNo: String,
    ifsc: String,
    bankName: String,
    branch: String,
  },
  { _id: false }
);

const vendorSchema = new mongoose.Schema(
  {
    vendorCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true },
    pan: { type: String, trim: true, uppercase: true },
    tin: { type: String, trim: true },
    bankDetails: bankDetailsSchema,
    status: {
      type: String,
      enum: VENDOR_STATUSES,
      default: "pending",
    },
    onboardingStatus: {
      type: String,
      enum: ["draft", "submitted", "verified", "rejected"],
      default: "draft",
    },
  },
  { timestamps: true }
);

vendorSchema.index({ vendorCode: 1 });
vendorSchema.index({ gstin: 1 });

export default mongoose.models.Vendor || mongoose.model("Vendor", vendorSchema);
