import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import GRN from "@/models/GRN";
import PurchaseOrder from "@/models/PurchaseOrder";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const poNumber = searchParams.get("poNumber");

    await connectDB();
    const filter = poNumber ? { poNumber } : {};
    const grns = await GRN.find(filter)
      .sort({ receivedDate: -1 })
      .limit(50)
      .populate("vendorId", "name vendorCode")
      .lean();

    return NextResponse.json({ grns });
  } catch (error) {
    console.error("List GRN error:", error);
    return NextResponse.json({ error: "Failed to fetch GRNs" }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { grnNumber, poNumber, vendorId, lineItems, receivedDate } = body;

    if (!grnNumber?.trim() || !poNumber?.trim() || !vendorId) {
      return NextResponse.json(
        { error: "grnNumber, poNumber, and vendorId are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const po = await PurchaseOrder.findOne({ poNumber: poNumber.trim() });
    const grn = await GRN.create({
      grnNumber: grnNumber.trim(),
      poNumber: poNumber.trim(),
      poId: po?._id,
      vendorId,
      lineItems: lineItems || [],
      receivedDate: receivedDate ? new Date(receivedDate) : undefined,
      createdBy: user._id,
      status: "closed",
    });

    return NextResponse.json({ grn }, { status: 201 });
  } catch (error) {
    console.error("Create GRN error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "GRN number already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to create GRN" }, { status: 500 });
  }
}
