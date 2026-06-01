import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import {
  getApAgingReport,
  getGstReport,
  getExceptionsReport,
  getFullReports,
} from "@/lib/reports";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";

    await connectDB();

    let data;
    switch (type) {
      case "aging":
        data = { apAging: await getApAgingReport() };
        break;
      case "gst":
        data = { gst: await getGstReport() };
        break;
      case "exceptions":
        data = { exceptions: await getExceptionsReport() };
        break;
      case "all":
      default:
        data = await getFullReports();
        break;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json(
      { error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}
