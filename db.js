import { Pool } from "pg";
import bcrypt from "bcryptjs";

const g = globalThis;
export const pool = g._csPool || (g._csPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: /sslmode=require/.test(process.env.DATABASE_URL || "") ? { rejectUnauthorized: false } : undefined,
  max: 5,
}));

const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;
const SEED = [
  ["Introduction to Algorithms","Books",420,"Campus","Lerato M.",U("1544947950-fa07a98d237f"),"Well-kept textbook, ideal for computer science and software development modules."],
  ["Wireless Headphones","Electronics",650,"Bellville","Tech Corner",U("1505740420928-5e560c06d30e"),"Comfortable over-ear wireless headphones with charging cable included."],
  ["Scientific Calculator","Study",180,"Campus","Siyanda N.",U("1587145820266-a5951ee6f620"),"Scientific calculator in excellent condition."],
  ["Campus Hoodie","Fashion",320,"Cape Town","Campus Threads",U("1556821840-3a63f95609a7"),"Warm everyday hoodie, ready for collection."],
  ["Study Desk Lamp","Home",220,"Observatory","Nandi K.",U("1507473885765-e6ed057f782c"),"Adjustable desk lamp with bright LED lighting."],
  ["Laptop Backpack","Fashion",290,"Campus","Mpho D.",U("1553062407-98eeb64c6a62"),"Padded laptop backpack with multiple compartments."],
];

// Creates tables (and demo data) automatically the first time the API is used.
let ready;
export function ensureDb() {
  if (!ready) ready = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'Student', created_at TIMESTAMPTZ DEFAULT now());
      CREATE TABLE IF NOT EXISTS products(
        id SERIAL PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, price NUMERIC NOT NULL CHECK(price>=0),
        location TEXT NOT NULL, seller_id INT REFERENCES users(id), seller TEXT NOT NULL, image TEXT,
        description TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());`);
    const { rows } = await pool.query("SELECT 1 FROM users LIMIT 1");
    if (!rows.length) {
      await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",
        ["Alex Demo", "demo@community.store", await bcrypt.hash("demo123", 10), "Student"]);
      for (const [t, c, p, l, s, i, d] of SEED)
        await pool.query("INSERT INTO products(title,category,price,location,seller,image,description) VALUES($1,$2,$3,$4,$5,$6,$7)", [t, c, p, l, s, i, d]);
    }
  })().catch((e) => { ready = null; throw e; });
  return ready;
}
