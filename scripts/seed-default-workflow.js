/**
 * Run after MongoDB is up: node scripts/seed-default-workflow.js
 * Requires MONGODB_URI in .env.local (load manually or export).
 */
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ap-automation";

const workflowSchema = new mongoose.Schema(
  {
    name: String,
    rules: [
      {
        amountMin: Number,
        amountMax: Number,
        approvers: [String],
        escalationAfterHours: Number,
      },
    ],
    isDefault: Boolean,
  },
  { timestamps: true }
);

const ApprovalWorkflow =
  mongoose.models.ApprovalWorkflow ||
  mongoose.model("ApprovalWorkflow", workflowSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const existing = await ApprovalWorkflow.findOne({ isDefault: true });
  if (existing) {
    console.log("Default workflow already exists:", existing.name);
    await mongoose.disconnect();
    return;
  }

  await ApprovalWorkflow.create({
    name: "Standard AP Approval",
    isDefault: true,
    rules: [
      {
        amountMin: 0,
        amountMax: 10000,
        approvers: ["approver_l1"],
        escalationAfterHours: 48,
      },
      {
        amountMin: 10000,
        amountMax: 100000,
        approvers: ["approver_l1", "approver_l2"],
        escalationAfterHours: 48,
      },
      {
        amountMin: 100000,
        amountMax: Number.MAX_SAFE_INTEGER,
        approvers: ["approver_l1", "approver_l2", "cfo"],
        escalationAfterHours: 24,
      },
    ],
  });

  console.log("Default approval workflow seeded.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
