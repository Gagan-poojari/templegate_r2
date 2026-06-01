import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";
import { getDashboardStats } from "@/lib/dashboard-stats";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    await connectDB();
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard stats" },
      { status: 500 }
    );
  }
}
