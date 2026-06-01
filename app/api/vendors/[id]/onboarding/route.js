import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import Vendor from "@/models/Vendor";
import { serializeVendor } from "@/lib/vendor-serialize";
import { validateVendorPayload } from "@/lib/vendor-validation";

const REVIEW_ROLES = ["admin", "vendor_manager"];

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const { action, remarks } = await request.json();
    await connectDB();

    const vendor = await Vendor.findById(params.id);
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (action === "submit") {
      const errors = await validateVendorPayload(
        vendor.toObject(),
        vendor._id
      );
      if (errors.length) {
        return NextResponse.json({ errors }, { status: 400 });
      }
      if (!vendor.gstin) {
        return NextResponse.json(
          { errors: ["GSTIN is required before submitting onboarding"] },
          { status: 400 }
        );
      }
      vendor.onboardingStatus = "submitted";
      vendor.status = "pending";
      await vendor.save();
      return NextResponse.json({ vendor: serializeVendor(vendor) });
    }

    if (!REVIEW_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "verify") {
      vendor.onboardingStatus = "verified";
      vendor.status = "active";
      await vendor.save();
      return NextResponse.json({ vendor: serializeVendor(vendor) });
    }

    if (action === "reject") {
      vendor.onboardingStatus = "rejected";
      vendor.status = "inactive";
      await vendor.save();
      return NextResponse.json({
        vendor: serializeVendor(vendor),
        remarks: remarks || "",
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use submit, verify, or reject" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Onboarding action failed" },
      { status: 500 }
    );
  }
}
