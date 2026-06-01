import { cookies } from "next/headers";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function getSessionUser() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = verifyToken(token);
    await connectDB();
    const user = await User.findById(payload.userId).select("-password");
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export function unauthorizedResponse(message = "Unauthorized") {
  return Response.json({ error: message }, { status: 401 });
}
