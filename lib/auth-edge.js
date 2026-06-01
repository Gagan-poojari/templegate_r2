import { jwtVerify } from "jose";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  return new TextEncoder().encode(secret);
}

export async function verifyTokenEdge(token) {
  const { payload } = await jwtVerify(token, getSecretKey());
  return payload;
}
