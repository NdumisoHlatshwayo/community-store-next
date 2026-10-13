import { pool } from "@/lib/db";
import { authed, bad, ok } from "@/lib/guard";
export const POST = authed(async (u,_req,{params}) => {
  const pid=Number(params.id);
  if (!(await pool.query("SELECT 1 FROM products WHERE id=$1",[pid])).rows.length) return bad("Product not found",404);
  const del=await pool.query("DELETE FROM favorites WHERE user_id=$1 AND product_id=$2",[u.id,pid]);
  if(!del.rowCount) await pool.query("INSERT INTO favorites VALUES($1,$2)",[u.id,pid]);
  return ok((await pool.query("SELECT product_id FROM favorites WHERE user_id=$1",[u.id])).rows.map(r=>r.product_id));
});