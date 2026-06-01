/**
 * Creates demo approver accounts (password: Approver@123)
 * Usage: node scripts/seed-approver-users.js
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ap-automation";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: String,
    isActive: Boolean,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

const APPROVERS = [
  { name: "L1 Approver", email: "l1@demo.local", role: "approver_l1" },
  { name: "L2 Approver", email: "l2@demo.local", role: "approver_l2" },
  { name: "CFO Approver", email: "cfo@demo.local", role: "cfo" },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const hash = await bcrypt.hash("Approver@123", 12);

  for (const a of APPROVERS) {
    const exists = await User.findOne({ email: a.email });
    if (exists) {
      console.log("Exists:", a.email);
      continue;
    }
    await User.create({ ...a, password: hash, isActive: true });
    console.log("Created:", a.email, `(${a.role})`);
  }

  console.log("\nPassword for all: Approver@123");
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
