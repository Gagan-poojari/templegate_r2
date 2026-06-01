import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import Vendor from "@/models/Vendor";
import { serializeVendor } from "@/lib/vendor-serialize";
import {
  normalizeVendorInput,
  validateVendorPayload,
} from "@/lib/vendor-validation";
import { VENDOR_STATUSES } from "@/types";

export async function GET(_request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    await connectDB();
    const vendor = await Vendor.findById(params.id);
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    return NextResponse.json({ vendor: serializeVendor(vendor) });
  } catch (error) {
    console.error("Get vendor error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    await connectDB();

    const vendor = await Vendor.findById(params.id);
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const data = normalizeVendorInput({ ...vendor.toObject(), ...body });
    const errors = await validateVendorPayload(data, params.id);
    if (errors.length) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    Object.assign(vendor, data);
    if (body.status && VENDOR_STATUSES.includes(body.status)) {
      vendor.status = body.status;
    }

    await vendor.save();
    return NextResponse.json({ vendor: serializeVendor(vendor) });
  } catch (error) {
    console.error("Update vendor error:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const allowed = ["admin", "vendor_manager"];
  if (!allowed.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const vendor = await Vendor.findByIdAndDelete(params.id);
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete vendor error:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
