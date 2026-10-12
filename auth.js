import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { pool } from "./db";

const COOKIE = "cs_session";
const key = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET is missing or too short");
  return new TextEncoder().encode(s);
};

export async function createSession(userId) {
  const token = await new SignJWT({ uid: userId }).setProtectedHeader({ alg: "HS256" })
    .setIssuedAt().setExpirationTime("7d").sign(key());
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 7 });
}
export function destroySession() { cookies().delete(COOKIE); }

export async function currentUser() {
  const t = cookies().get(COOKIE)?.value; if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, key());
    const { rows } = await pool.query("SELECT id,name,email,role FROM users WHERE id=$1", [payload.uid]);
    return rows[0] || null;
  } catch { return null; }
}
