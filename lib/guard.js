import { NextResponse } from "next/server";
import { ensureDb } from "./db";
import { currentUser } from "./auth";
export const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export const ok = (d, s = 200) => NextResponse.json(d, { status: s });
export const authed = (fn) => async (req, ctx) => {
  await ensureDb();
  const u = await currentUser();
  if (!u) return bad("Please sign in first", 401);
  return fn(u, req, ctx);
};