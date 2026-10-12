import { NextResponse } from "next/server";
import { ensureDb } from "@/lib/db";
import { currentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function GET() { await ensureDb(); return NextResponse.json({ user: await currentUser() }); }
