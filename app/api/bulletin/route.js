import { pool, ensureDb } from "@/lib/db";
import { authed, bad, ok } from "@/lib/guard";
export const dynamic = "force-dynamic";
export async function GET() { await ensureDb(); return ok((await pool.query("SELECT type,title,body,date,author FROM bulletin ORDER BY id DESC")).rows); }
export const POST = authed(async (u, req) => {
  const d = await req.json().catch(() => ({}));
  const type = ["Announcement","Event","Service","Request"].includes(d.type) ? d.type : "Announcement";
  const title = String(d.title || "").trim().slice(0,120), body = String(d.body || "").trim().slice(0,1500);
  if (!title || !body) return bad("Title and details are required");
  await pool.query("INSERT INTO bulletin(type,title,body,date,author,user_id) VALUES($1,$2,$3,$4,$5,$6)",[type,title,body,String(d.date||"New").slice(0,30),u.name,u.id]);
  return ok({ok:true},201);
});