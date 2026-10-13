import { pool } from "@/lib/db";
import { authed, ok } from "@/lib/guard";
export const dynamic = "force-dynamic";
export const GET = authed(async (u) => ok((await pool.query("SELECT icon,title,body,read,to_char(created_at,'DD Mon HH24:MI') AS time FROM notifications WHERE user_id=$1 ORDER BY id DESC",[u.id])).rows));