import { pool } from "@/lib/db";
import { authed, ok } from "@/lib/guard";
export const POST = authed(async (u) => { await pool.query("UPDATE notifications SET read=true WHERE user_id=$1",[u.id]); return ok({ok:true}); });