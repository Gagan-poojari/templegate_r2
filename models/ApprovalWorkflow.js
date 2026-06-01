import mongoose from "mongoose";

const workflowRuleSchema = new mongoose.Schema(
  {
    amountMin: { type: Number, required: true, min: 0, default: 0 },
    amountMax: { type: Number, required: true, min: 0 },
    approvers: [
      {
        type: String,
        enum: ["approver_l1", "approver_l2", "cfo"],
      },
    ],
    escalationAfterHours: { type: Number, default: 48, min: 1 },
  },
  { _id: true }
);

const approvalWorkflowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rules: [workflowRuleSchema],
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.ApprovalWorkflow ||
  mongoose.model("ApprovalWorkflow", approvalWorkflowSchema);
