import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import Vendor from "@/models/Vendor";
import { serializeVendor } from "@/lib/vendor-serialize";
import {
  normalizeVendorInput,
  validateVendorPayload,
} from "@/lib/vendor-validation";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");
    const onboarding = searchParams.get("onboarding");
    const activeOnly = searchParams.get("activeOnly") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );

    const filter = {};
    if (status) filter.status = status;
    if (onboarding) filter.onboardingStatus = onboarding;
    if (activeOnly) filter.status = "active";
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { vendorCode: { $regex: q, $options: "i" } },
        { gstin: { $regex: q, $options: "i" } },
      ];
    }

    await connectDB();

    const [items, total] = await Promise.all([
      Vendor.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Vendor.countDocuments(filter),
    ]);

    return NextResponse.json({
      vendors: items.map(serializeVendor),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error("List vendors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const data = normalizeVendorInput(body);

    await connectDB();
    const errors = await validateVendorPayload(data);
    if (errors.length) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const vendor = await Vendor.create({
      ...data,
      status: data.status || "pending",
      onboardingStatus: data.onboardingStatus || "draft",
    });

    return NextResponse.json(
      { vendor: serializeVendor(vendor) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create vendor error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Vendor code or GSTIN already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
}
