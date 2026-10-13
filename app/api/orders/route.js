import { pool, notify } from "@/lib/db";
import { authed, bad, ok } from "@/lib/guard";
export const dynamic = "force-dynamic";
export const POST = authed(async (u,req) => {
  const d=await req.json().catch(()=>({}));
  if(!Array.isArray(d.items)||!d.items.length||d.items.length>50) return bad("Cart is empty");
  const lines=[]; let subtotal=0;
  for(const it of d.items){ const id=Number(it.id),qty=parseInt(it.qty,10); const {rows}=await pool.query("SELECT id,title,price::float AS price FROM products WHERE id=$1",[id]); if(!rows[0]||!(qty>=1&&qty<=99)) return bad("Invalid product or quantity"); lines.push({...rows[0],qty}); subtotal+=rows[0].price*qty; }
  const fee=Math.round(subtotal*.02), total=subtotal+fee;
  const payment=["PayFast Sandbox","SnapScan Demo"].includes(d.payment)?d.payment:"PayFast Sandbox";
  const {rows}=await pool.query("INSERT INTO orders(user_id,name,email,collection,payment,subtotal,fee,total,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'Paid (demo)') RETURNING id",[u.id,String(d.name||"").slice(0,80),String(d.email||"").slice(0,120),String(d.collection||"").slice(0,60),payment,subtotal,fee,total]);
  for(const l of lines) await pool.query("INSERT INTO order_items VALUES($1,$2,$3,$4,$5)",[rows[0].id,l.id,l.title,l.price,l.qty]);
  await notify(u.id,"✓","Demo order confirmed",`Order #${rows[0].id} was created. Total R${total}.`);
  return ok({orderId:rows[0].id,subtotal,fee,total},201);
});
export const GET = authed(async (u) => {
  const {rows}=await pool.query(`SELECT o.id,o.total::float AS total,o.status,to_char(o.created_at,'DD Mon YYYY HH24:MI') AS date,(SELECT json_agg(json_build_object('title',title,'qty',qty)) FROM order_items i WHERE i.order_id=o.id) AS items FROM orders o WHERE o.user_id=$1 ORDER BY o.id DESC`,[u.id]);
  return ok(rows);
});