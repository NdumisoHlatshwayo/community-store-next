import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool, ensureDb } from "@/lib/db";
import { createSession } from "@/lib/auth";
export async function POST(req) {
  await ensureDb();
  const d = await req.json().catch(() => ({}));
  const { rows } = await pool.query("SELECT * FROM users WHERE email=$1", [String(d.email || "").trim().toLowerCase()]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(String(d.password || ""), u.password_hash)))
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  await createSession(u.id);
  return NextResponse.json({ user: { id: u.id, name: u.name, email: u.email, role: u.role } });
}
