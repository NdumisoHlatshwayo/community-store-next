import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool, ensureDb } from "@/lib/db";
import { createSession } from "@/lib/auth";
const ROLES = ["Student", "Vendor", "Community Resident", "Faculty"];
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  await ensureDb();
  const d = await req.json().catch(() => ({}));
  const name = String(d.name || "").trim().slice(0, 80);
  const email = String(d.email || "").trim().toLowerCase().slice(0, 120);
  const password = String(d.password || "");
  const role = ROLES.includes(d.role) ? d.role : "Student";
  if (!name) return bad("Please enter your full name");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad("Please enter a valid email address");
  if (password.length < 6) return bad("Password must be at least 6 characters");
  try {
    const { rows } = await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role",[name,email,await bcrypt.hash(password,10),role]);
    await createSession(rows[0].id);
    return NextResponse.json({ user: rows[0] }, { status: 201 });
  } catch (e) {
    if (e.code === "23505") return bad("An account with this email already exists", 409);
    throw e;
  }
}
