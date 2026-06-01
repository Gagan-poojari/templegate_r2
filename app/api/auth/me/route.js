import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  return NextResponse.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}
