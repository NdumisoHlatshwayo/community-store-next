"use client";
import { useEffect, useState } from "react";

const money = (n) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n);
async function api(method, path, body) {
  const res = await fetch("/api" + path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [view, setView] = useState("home");       // home | auth | sell
  const [tab, setTab] = useState("signin");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");\n  const [category,setCategory]=useState("all");\n  const [sort,setSort]=useState("featured");

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };
  const loadProducts = () => api("GET", "/products").then(setProducts).catch((e) => flash(e.message));
  useEffect(() => { api("GET", "/me").then((d) => setUser(d.user)).catch(() => {}); loadProducts(); }, []);

  async function submit(e, path, build, done) {
    e.preventDefault(); setBusy(true);
    try { const d = await api("POST", path, build(new FormData(e.target))); await done(d, e.target); }
    catch (x) { flash(x.message); } finally { setBusy(false); }
  }
  const onAuth = (d) => { setUser(d.user); setView("home"); flash(`Welcome, ${d.user.name.split(" ")[0]}!`); };
  const logout = async () => { await api("POST", "/logout"); setUser(null); setView("home"); flash("Signed out"); };
  let shown = products.filter((p) => (category === "all" || p.category === category) && (`${p.title} ${p.category} ${p.location}`).toLowerCase().includes(search.toLowerCase()));\n  if(sort==="low") shown=[...shown].sort((a,b)=>a.price-b.price);\n  if(sort==="high") shown=[...shown].sort((a,b)=>b.price-a.price);\n  if(sort==="rating") shown=[...shown].sort((a,b)=>(b.rating||0)-(a.rating||0));

  return (<>
    <div className={"toast" + (msg ? " show" : "")} aria-live="polite">{msg}</div>
    <header className="topbar">
      <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setView("home"); }}>
        <span className="brand-mark">CS</span><span><strong>Community</strong> Store</span></a>
      <nav className="desktop-nav"><button onClick={() => setView("home")}>Marketplace</button><button onClick={() => location.href="#community"}>Community</button></nav>\n      <div className="header-actions">
        <button className="btn btn-secondary" onClick={() => setView(user ? "sell" : "auth")}>+ Sell</button>
        {user ? <><span style={{ fontWeight: 600 }}>{user.name.split(" ")[0]}</span><button className="btn btn-ghost" onClick={logout}>Sign out</button></>
              : <button className="btn btn-ghost" onClick={() => setView("auth")}>Sign in</button>}
      </div>
    </header>

    <main id="app">
      {view === "auth" && (
        <div className="auth-shell"><div className="auth-card" style={{ margin: "0 auto", maxWidth: 480 }}>
          <div className="auth-tabs">
            <button className={tab === "signin" ? "active" : ""} onClick={() => setTab("signin")}>Sign in</button>
            <button className={tab === "signup" ? "active" : ""} onClick={() => setTab("signup")}>Create account</button>
          </div>
          {tab === "signin" ? (
            <form className="auth-form" onSubmit={(e) => submit(e, "/login", (f) => Object.fromEntries(f), onAuth)}>
              <h2>Welcome back</h2><p>Sign in with the email and password you registered with.</p>
              <label>Email address<input name="email" type="email" required autoComplete="email" /></label>
              <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
              <button className="btn btn-primary full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
              <p className="form-note">No account yet? Choose <b>Create account</b> above. Demo: <b>demo@community.store</b> / <b>demo123</b></p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={(e) => submit(e, "/register", (f) => Object.fromEntries(f), onAuth)}>
              <h2>Create your account</h2><p>Join as a student, vendor or community resident.</p>
              <label>Full name<input name="name" required autoComplete="name" /></label>
              <label>Email address<input name="email" type="email" required autoComplete="email" /></label>
              <label>Role<select name="role"><option>Student</option><option>Vendor</option><option>Community Resident</option><option>Faculty</option></select></label>
              <label>Password<input name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="Minimum 6 characters" /></label>
              <button className="btn btn-primary full" disabled={busy}>{busy ? "Creating…" : "Register"}</button>
            </form>
          )}
        </div></div>
      )}

      {view === "sell" && (
        <section className="narrow-view" style={{ display: "block" }}>
          <div className="page-head"><div><span className="eyebrow">Seller tools</span><h1>Create a listing</h1></div></div>
          <form className="panel form-grid" onSubmit={(e) => submit(e, "/products", (f) => Object.fromEntries(f), async (_, form) => { form.reset(); await loadProducts(); setView("home"); flash("Listing published"); })}>
            <label className="span-2">Listing title<input name="title" required /></label>
            <label>Category<select name="category">{["Books", "Electronics", "Study", "Fashion", "Home", "Other"].map((c) => <option key={c}>{c}</option>)}</select></label>
            <label>Price (R)<input name="price" type="number" min="0" step="1" required /></label>
            <label>Location<input name="location" required placeholder="e.g. Campus" /></label>
            <label>Image URL (optional)<input name="image" type="url" placeholder="https://…" /></label>
            <label className="span-2">Description<textarea name="description" rows={4} required /></label>
            <div className="span-2 form-actions"><button type="button" className="btn btn-secondary" onClick={() => setView("home")}>Cancel</button><button className="btn btn-primary" disabled={busy}>Publish listing</button></div>
          </form>
        </section>
      )}

      {view === "home" && (
        <section className="content-section" id="marketplace">
          <div className="section-heading"><div><span className="eyebrow">Marketplace</span><h2>Find what you need</h2></div></div>
          <div className="search-panel"><label className="search-box"><span>⌕</span>
            <input type="search" placeholder="Search products, categories or locations…" value={search} onChange={(e) => setSearch(e.target.value)} /></label></div>
          <div className="product-grid">
            {shown.map((p) => (
              <article className="product-card" key={p.id}>
                <div className="product-img"><img src={p.image || `https://picsum.photos/seed/${p.id}/700/520`} alt={p.title} /><span className="category-tag">{p.category}</span></div>
                <div className="product-body"><h3>{p.title}</h3><div className="product-meta">{p.location} · {p.seller}</div>
                  <div className="product-price-row"><div><div className="price">{money(p.price)}</div><span className="rating">★ {p.rating || "New"} {p.reviewCount ? `(${p.reviewCount})` : ""}</span></div></div></div>
              </article>))}
          </div>
          {!shown.length && <div className="empty"><h3>No products found</h3><p>Try a different search.</p></div>}
        </section>
      )}
    </main>
  </>);
}
