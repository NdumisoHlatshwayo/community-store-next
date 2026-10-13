import { pool } from "@/lib/db";
import { authed, ok } from "@/lib/guard";
export const dynamic = "force-dynamic";
export const GET = authed(async (u) => {
  const result = await pool.query("SELECT product_id FROM favorites WHERE user_id=$1", [u.id]);
  return ok(result.rows.map((row) => row.product_id));
});