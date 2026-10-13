import { pool, ensureDb } from "@/lib/db";
import { authed, bad, ok } from "@/lib/guard";
export const dynamic = "force-dynamic";
export async function GET(_req,{params}) { await ensureDb(); return ok((await pool.query("SELECT author,rating,comment FROM reviews WHERE product_id=$1 ORDER BY id DESC",[Number(params.id)])).rows); }
export const POST = authed(async (u,req,{params}) => {
  const pid=Number(params.id); const {rows}=await pool.query("SELECT seller_id FROM products WHERE id=$1",[pid]);
  if(!rows[0]) return bad("Product not found",404); if(rows[0].seller_id===u.id) return bad("You cannot review your own listing",403);
  const d=await req.json().catch(()=>({})), rating=parseInt(d.rating,10); if(!(rating>=1&&rating<=5)) return bad("Rating must be 1 to 5");
  try{await pool.query("INSERT INTO reviews(product_id,user_id,author,rating,comment) VALUES($1,$2,$3,$4,$5)",[pid,u.id,u.name,rating,String(d.comment||"").trim().slice(0,500)]);}
  catch(e){if(e.code==="23505") return bad("You have already reviewed this product",409); throw e;}
  return ok({ok:true},201);
});