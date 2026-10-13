import { Pool } from "pg";
import bcrypt from "bcryptjs";

const g = globalThis;
export const pool = g._csPool || (g._csPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: /sslmode=require/.test(process.env.DATABASE_URL || "") ? { rejectUnauthorized: false } : undefined,
  max: 5,
}));
const U=(id)=>`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;
const SEED=[
["Introduction to Algorithms","Books",420,"Campus","Lerato M.",U("1544947950-fa07a98d237f"),"Well-kept textbook, ideal for computer science and software development modules.",4.8],
["Wireless Headphones","Electronics",650,"Bellville","Tech Corner",U("1505740420928-5e560c06d30e"),"Comfortable over-ear wireless headphones with charging cable included.",4.6],
["Scientific Calculator","Study",180,"Campus","Siyanda N.",U("1587145820266-a5951ee6f620"),"Scientific calculator in excellent condition.",4.9],
["Campus Hoodie","Fashion",320,"Cape Town","Campus Threads",U("1556821840-3a63f95609a7"),"Warm everyday hoodie, ready for collection.",4.7],
["Study Desk Lamp","Home",220,"Observatory","Nandi K.",U("1507473885765-e6ed057f782c"),"Adjustable desk lamp with bright LED lighting.",4.5],
["Laptop Backpack","Fashion",290,"Campus","Mpho D.",U("1553062407-98eeb64c6a62"),"Padded laptop backpack with multiple compartments and bottle pockets.",4.8],
["Mechanical Keyboard","Electronics",550,"Woodstock","Byte Market",U("1587829741301-dc798b83add3"),"Compact mechanical keyboard with tactile switches, ideal for coding and study.",4.7],
["Accounting Notes Bundle","Study",90,"Campus","Ayesha P.",U("1456324504439-367cee3b3c32"),"Organised study notes and revision summaries for introductory accounting.",4.4]
];
const BULLETIN=[
["Event","Student Entrepreneurship Meetup","Meet student founders, local vendors and creators. Share ideas and discover collaboration opportunities.","17 Oct 2026","Community Team"],
["Announcement","Weekend Book Exchange","Bring textbooks you no longer need and exchange them with other students at the main campus collection point.","24 Oct 2026","Student Society"],
["Service","Affordable CV Review","Peer-led CV review sessions for students preparing for internships and graduate applications.","Ongoing","Career Volunteers"],
["Request","Looking for a statistics tutor","Second-year student looking for weekly statistics support near campus.","This week","Community Member"]
];
let ready;
export function ensureDb(){
 if(!ready) ready=(async()=>{
  await pool.query(`CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'Student',created_at TIMESTAMPTZ DEFAULT now());
  CREATE TABLE IF NOT EXISTS products(id SERIAL PRIMARY KEY,title TEXT NOT NULL,category TEXT NOT NULL,price NUMERIC NOT NULL CHECK(price>=0),location TEXT NOT NULL,seller_id INT REFERENCES users(id),seller TEXT NOT NULL,image TEXT,description TEXT NOT NULL,created_at TIMESTAMPTZ DEFAULT now());`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS seed_rating NUMERIC;
  CREATE TABLE IF NOT EXISTS reviews(id SERIAL PRIMARY KEY,product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,user_id INT NOT NULL REFERENCES users(id),author TEXT NOT NULL,rating INT NOT NULL CHECK(rating BETWEEN 1 AND 5),comment TEXT,created_at TIMESTAMPTZ DEFAULT now(),UNIQUE(product_id,user_id));
  CREATE TABLE IF NOT EXISTS favorites(user_id INT REFERENCES users(id),product_id INT REFERENCES products(id) ON DELETE CASCADE,PRIMARY KEY(user_id,product_id));
  CREATE TABLE IF NOT EXISTS orders(id SERIAL PRIMARY KEY,user_id INT NOT NULL REFERENCES users(id),name TEXT,email TEXT,collection TEXT,payment TEXT,subtotal NUMERIC,fee NUMERIC,total NUMERIC,status TEXT,created_at TIMESTAMPTZ DEFAULT now());
  CREATE TABLE IF NOT EXISTS order_items(order_id INT REFERENCES orders(id) ON DELETE CASCADE,product_id INT,title TEXT,price NUMERIC,qty INT);
  CREATE TABLE IF NOT EXISTS bulletin(id SERIAL PRIMARY KEY,type TEXT,title TEXT,body TEXT,date TEXT,author TEXT,user_id INT,created_at TIMESTAMPTZ DEFAULT now());
  CREATE TABLE IF NOT EXISTS notifications(id SERIAL PRIMARY KEY,user_id INT REFERENCES users(id),icon TEXT,title TEXT,body TEXT,read BOOLEAN DEFAULT false,created_at TIMESTAMPTZ DEFAULT now());`);
  if(!(await pool.query("SELECT 1 FROM users LIMIT 1")).rows.length) await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING",["Alex Demo","demo@community.store",await bcrypt.hash("demo123",10),"Student"]);
  for(const [t,c,p,l,s,i,d,r] of SEED) await pool.query(`INSERT INTO products(title,category,price,location,seller,image,description,seed_rating) SELECT $1,$2,$3,$4,$5,$6,$7,$8 WHERE NOT EXISTS (SELECT 1 FROM products WHERE title=$1 AND seller_id IS NULL)`,[t,c,p,l,s,i,d,r]);
  if(!(await pool.query("SELECT 1 FROM bulletin LIMIT 1")).rows.length) for(const [t,ti,b,d,a] of BULLETIN) await pool.query("INSERT INTO bulletin(type,title,body,date,author) VALUES($1,$2,$3,$4,$5)",[t,ti,b,d,a]);
 })().catch(e=>{ready=null;throw e});
 return ready;
}
export async function notify(uid,icon,title,body){await pool.query("INSERT INTO notifications(user_id,icon,title,body) VALUES($1,$2,$3,$4)",[uid,icon,title,body]);}
