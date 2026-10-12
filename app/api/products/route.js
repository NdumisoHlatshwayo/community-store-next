import { NextResponse } from "next/server";
import { pool, ensureDb } from "@/lib/db";
import { currentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
const CATS = ["Books", "Electronics", "Study", "Fashion", "Home", "Other"];
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function GET() {
  await ensureDb();
  const { rows } = await pool.query("SELECT id,title,category,price::float AS price,location,seller,image,description FROM products ORDER BY id DESC");
  return NextResponse.json(rows);
}
export async function POST(req) {
  await ensureDb();
  const u = await currentUser();
  if (!u) return bad("Please sign in to publish a listing", 401);
  const d = await req.json().catch(() => ({}));
  const title=String(d.title||"").trim().slice(0,100), description=String(d.description||"").trim().slice(0,1000);
  const location=String(d.location||"").trim().slice(0,60), price=Number(d.price);
  const category=CATS.includes(d.category)?d.category:"Other";
  const image=String(d.image||"").trim().slice(0,500);
  if(!title||!description||!location||!Number.isFinite(price)||price<0||price>1e6) return bad("Title, description, location and a valid price are required");
  if(image&&!/^https?:\/\//.test(image)) return bad("Image must be an http(s) link");
  const {rows}=await pool.query("INSERT INTO products(title,category,price,location,seller_id,seller,image,description) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",[title,category,price,location,u.id,u.name,image||null,description]);
  return NextResponse.json({id:rows[0].id},{status:201});
}
