import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import PurchaseOrder from "@/models/PurchaseOrder";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const poNumber = searchParams.get("poNumber");

    await connectDB();
    const filter = poNumber ? { poNumber } : {};
    const orders = await PurchaseOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("vendorId", "name vendorCode")
      .lean();

    return NextResponse.json({ purchaseOrders: orders });
  } catch (error) {
    console.error("List PO error:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { poNumber, vendorId, lineItems, totalAmount } = body;

    if (!poNumber?.trim() || !vendorId || totalAmount == null) {
      return NextResponse.json(
        { error: "poNumber, vendorId, and totalAmount are required" },
        { status: 400 }
      );
    }

    await connectDB();
    const po = await PurchaseOrder.create({
      poNumber: poNumber.trim(),
      vendorId,
      lineItems: lineItems || [],
      totalAmount,
      createdBy: user._id,
    });

    return NextResponse.json({ purchaseOrder: po }, { status: 201 });
  } catch (error) {
    console.error("Create PO error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "PO number already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}
