# Community Store (Next.js + Postgres)

Accounts: anyone can **Create account** (name, email, password) and later **Sign in** with those same details.
Passwords are hashed (bcrypt); login is a signed, httpOnly cookie valid for 7 days.

## Implemented in this build
Register, login, logout, session check, marketplace with search, create listing (login required), seeded demo data.
Demo account: `demo@community.store` / `demo123`. Tables are created automatically on first request.
NOT yet ported from the earlier prototype: cart, checkout/orders, reviews, favourites, bulletin, notifications.

## Put it online (one link for your lecturer)
1. Create a GitHub repo and upload this folder (without node_modules / .next).
2. Go to vercel.com > Add New > Project > import the repo.
3. In the Vercel project: Storage > Create Database > **Neon (Postgres)** > connect it to the project. This adds `DATABASE_URL` automatically.
4. Settings > Environment Variables: add `AUTH_SECRET` = a long random string (e.g. run `openssl rand -base64 32`).
5. Deployments > Redeploy. Your link looks like `https://your-project.vercel.app`.
6. Open the link, create an account yourself, sign out, sign back in. Then send the link.

## Run locally
    npm install
    cp .env.example .env.local   # fill in DATABASE_URL and AUTH_SECRET
    npm run dev                  # http://localhost:3000

## API
POST /api/register, POST /api/login, POST /api/logout, GET /api/me, GET/POST /api/products
