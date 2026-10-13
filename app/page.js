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
  const [search, setSearch] = useState("");
  const [category,setCategory]=useState("all");
  const [sort,setSort]=useState("featured");
  const [selectedProduct,setSelectedProduct]=useState(null);
  const [cart,setCart]=useState([]);
  const [saved,setSaved]=useState([]);
  const [payment,setPayment]=useState("payfast");
  const [lastOrder,setLastOrder]=useState(null);
  const [posts,setPosts]=useState([
    {id:1,type:"Campus",title:"Textbook exchange this Friday",body:"Bring books you no longer need and swap with other students at the student centre.",author:"Community Store",date:"This week"},
    {id:2,type:"Notice",title:"Local sellers welcome",body:"Students, residents and verified vendors can share useful marketplace updates with the community.",author:"Community Store",date:"Community bulletin"}
  ]);

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
  const toggleSaved = (p) => setSaved((items) => items.some((x)=>x.id===p.id) ? items.filter((x)=>x.id!==p.id) : [...items,p]);
  const addToCart = (p) => { setCart((items)=>{ const hit=items.find((x)=>x.id===p.id); return hit ? items.map((x)=>x.id===p.id?{...x,qty:x.qty+1}:x) : [...items,{...p,qty:1}]; }); flash("Added to cart"); };
  const cartCount = cart.reduce((n,x)=>n+x.qty,0);
  const cartTotal = cart.reduce((n,p)=>n+p.price*p.qty,0);
  const completeDemoOrder = () => {
    if (!cart.length) return;
    const order = { id: `CS-${Date.now().toString().slice(-6)}`, total: cartTotal, payment, items: cartCount };
    setLastOrder(order); setCart([]); setView("success"); flash("Demo order completed");
  };
  let shown = products.filter((p) => (category === "all" || p.category === category) && (`${p.title} ${p.category} ${p.location}`).toLowerCase().includes(search.toLowerCase()));
  if(sort==="low") shown=[...shown].sort((a,b)=>a.price-b.price);
  if(sort==="high") shown=[...shown].sort((a,b)=>b.price-a.price);
  if(sort==="rating") shown=[...shown].sort((a,b)=>(b.rating||0)-(a.rating||0));

  return (<>
    <div className={"toast" + (msg ? " show" : "")} aria-live="polite">{msg}</div>
    <header className="topbar">
      <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setView("home"); }}>
        <span className="brand-mark">CS</span><span><strong>Community</strong> Store</span></a>
      <nav className="desktop-nav"><button onClick={() => setView("home")}>Marketplace</button><button onClick={() => setView("community")}>Community</button></nav>
      <div className="header-actions">
        <button className="btn btn-ghost" onClick={()=>setView("cart")}>Cart ({cartCount})</button>
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

      {view === "cart" && (
        <section className="narrow-view" style={{display:"block"}}>
          <div className="page-head"><span className="eyebrow">Your basket</span><h1>Cart</h1></div>
          <div className="panel">
            {!cart.length ? <div className="empty"><h3>Your cart is empty</h3><p>Add something from the marketplace.</p></div> :
            <>{cart.map((p)=><div className="cart-row" key={p.id}><div><strong>{p.title}</strong><div className="product-meta">{p.seller}</div></div><div className="cart-controls"><button onClick={()=>setCart(cart.map(x=>x.id===p.id?{...x,qty:Math.max(1,x.qty-1)}:x))}>−</button><span>{p.qty}</span><button onClick={()=>setCart(cart.map(x=>x.id===p.id?{...x,qty:x.qty+1}:x))}>+</button><strong>{money(p.price*p.qty)}</strong><button className="remove" onClick={()=>setCart(cart.filter(x=>x.id!==p.id))}>Remove</button></div></div>)}
            <div className="cart-total"><span>Total</span><strong>{money(cartTotal)}</strong></div><div className="form-actions"><button className="btn btn-secondary" onClick={()=>setView("home")}>Continue shopping</button><button className="btn btn-primary" onClick={()=>setView("checkout")}>Checkout</button></div></>}
            {!cart.length && <button className="btn btn-secondary" onClick={()=>setView("home")}>Continue shopping</button>}
          </div>
        </section>
      )}

      {view === "checkout" && (
        <section className="narrow-view" style={{display:"block"}}>
          <div className="page-head"><span className="eyebrow">Secure checkout demo</span><h1>Checkout</h1><p>This prototype simulates payment. No real money is charged.</p></div>
          <div className="checkout-grid">
            <div className="panel checkout-form">
              <h3>Payment method</h3>
              <label className="payment-option"><input type="radio" name="payment" checked={payment==="payfast"} onChange={()=>setPayment("payfast")}/><span><b>PayFast (Demo)</b><small>Simulated payment for project demonstration.</small></span></label>
              <label className="payment-option"><input type="radio" name="payment" checked={payment==="snapscan"} onChange={()=>setPayment("snapscan")}/><span><b>SnapScan (Demo)</b><small>Simulated QR/mobile payment for project demonstration.</small></span></label>
              <p className="form-note">No card, banking or payment credentials are collected by this prototype.</p>
              <div className="form-actions"><button className="btn btn-secondary" onClick={()=>setView("cart")}>Back to cart</button><button className="btn btn-primary" onClick={completeDemoOrder}>Confirm demo payment</button></div>
            </div>
            <aside className="panel summary-card"><h3>Order summary</h3>{cart.map(p=><div key={p.id}><span>{p.title} × {p.qty}</span><strong>{money(p.price*p.qty)}</strong></div>)}<div className="summary-total"><span>Total</span><strong>{money(cartTotal)}</strong></div><small>Demonstration checkout only — no real transaction.</small></aside>
          </div>
        </section>
      )}

      {view === "success" && lastOrder && (
        <section className="narrow-view" style={{display:"block"}}>
          <div className="panel order-success"><div className="success-check">✓</div><span className="eyebrow">Demo order confirmed</span><h1>Order successful</h1><p>Your simulated order <b>{lastOrder.id}</b> has been created for demonstration purposes.</p><div className="order-receipt"><span>Items</span><strong>{lastOrder.items}</strong><span>Payment</span><strong>{lastOrder.payment==="payfast"?"PayFast (Demo)":"SnapScan (Demo)"}</strong><span>Total</span><strong>{money(lastOrder.total)}</strong></div><p className="form-note">No real payment was processed.</p><button className="btn btn-primary" onClick={()=>setView("home")}>Return to marketplace</button></div>
        </section>
      )}

      {view === "community" && (
        <section className="narrow-view" style={{display:"block"}}>
          <div className="page-head split"><div><span className="eyebrow">Community bulletin</span><h1>Community</h1><p>Share useful notices, events and marketplace updates with the campus and local community.</p></div></div>
          {user && <form className="panel form-grid" onSubmit={(e)=>{e.preventDefault();const f=new FormData(e.target);setPosts([{id:Date.now(),type:f.get("type"),title:f.get("title"),body:f.get("body"),author:user.name,date:"Just now"},...posts]);e.target.reset();flash("Community post published");}}>
            <label>Post type<select name="type"><option>Notice</option><option>Campus</option><option>Event</option><option>Marketplace</option></select></label>
            <label>Title<input name="title" required placeholder="What would you like to share?" /></label>
            <label className="span-2">Message<textarea name="body" rows={4} required placeholder="Write your community update…" /></label>
            <div className="span-2 form-actions"><button className="btn btn-primary">Publish post</button></div>
          </form>}
          {!user && <div className="panel community-signin"><p>Sign in to publish a community post.</p><button className="btn btn-secondary" onClick={()=>setView("auth")}>Sign in</button></div>}
          <div className="bulletin-grid">{posts.map(post=><article className="bulletin-card" key={post.id}><span className="post-type">{post.type}</span><h3>{post.title}</h3><p>{post.body}</p><div className="post-footer"><span>{post.author}</span><span>{post.date}</span></div></article>)}</div>
        </section>
      )}

      {view === "home" && (
        <>
        <div className="prototype-note"><strong>Community Store prototype</strong><span>Responsive Next.js marketplace · demo checkout only</span></div>
        <section className="hero">
          <div className="hero-copy"><span className="eyebrow">Campus + local community marketplace</span><h1>Buy local. Sell simply.<br/><span>Build community.</span></h1><p>Discover affordable products and trusted sellers around your campus and local community.</p><div className="hero-actions"><button className="btn btn-primary" onClick={()=>document.getElementById("marketplace")?.scrollIntoView({behavior:"smooth"})}>Shop marketplace</button><button className="btn btn-secondary" onClick={()=>setView(user?"sell":"auth")}>+ Sell an item</button></div><div className="trust-row"><span>✓ Community focused</span><span>✓ Mobile first</span><span>✓ Secure checkout demo</span></div></div>
          <div className="hero-card"><div className="hero-card-top"><span>New Collection</span><span className="pill">Featured</span></div><h2>Fresh finds,<br/>better prices.</h2><p>Explore books, tech, fashion and everyday essentials from your community.</p><button className="btn btn-light" onClick={()=>document.getElementById("marketplace")?.scrollIntoView({behavior:"smooth"})}>Browse now →</button></div>
        </section>
        <section className="content-section" id="marketplace">
          <div className="section-heading"><div><span className="eyebrow">Marketplace</span><h2>Find what you need</h2></div></div>
          <div className="search-panel"><label className="search-box"><span>⌕</span><input type="search" placeholder="Search products, categories or locations…" value={search} onChange={(e) => setSearch(e.target.value)} /></label><select aria-label="Category" value={category} onChange={(e)=>setCategory(e.target.value)}><option value="all">All categories</option><option>Books</option><option>Electronics</option><option>Study</option><option>Fashion</option><option>Home</option><option>Other</option></select><select aria-label="Sort products" value={sort} onChange={(e)=>setSort(e.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="rating">Top rated</option></select></div>
          <div className="product-grid">
            {shown.map((p) => (
              <article className="product-card" key={p.id} onClick={()=>setSelectedProduct(p)} role="button" tabIndex={0} onKeyDown={(e)=>{if(e.key==="Enter")setSelectedProduct(p)}}>
                <div className="product-img"><img src={p.image || `https://picsum.photos/seed/${p.id}/700/520`} alt={p.title} /><span className="category-tag">{p.category}</span><button className={"favorite-btn"+(saved.some(x=>x.id===p.id)?" active":"")} aria-label="Save item" onClick={(e)=>{e.stopPropagation();toggleSaved(p)}}>{saved.some(x=>x.id===p.id)?"♥":"♡"}</button></div>
                <div className="product-body"><h3>{p.title}</h3><div className="product-meta">{p.location} · {p.seller}</div>
                  <div className="product-price-row"><div><div className="price">{money(p.price)}</div><span className="rating">★ {p.rating || "New"} {p.reviewCount ? `(${p.reviewCount})` : ""}</span></div></div></div>
              </article>))}
          </div>
          {!shown.length && <div className="empty"><h3>No products found</h3><p>Try a different search.</p></div>}
        </section>
        </>
      )}
    </main>
    {selectedProduct && <div className="modal-backdrop" onClick={()=>setSelectedProduct(null)}>
      <div className="detail-card" onClick={(e)=>e.stopPropagation()}>
        <button className="modal-x" onClick={()=>setSelectedProduct(null)}>×</button>
        <img src={selectedProduct.image || `https://picsum.photos/seed/${selectedProduct.id}/900/650`} alt={selectedProduct.title}/>
        <div className="detail-copy"><span className="eyebrow">{selectedProduct.category}</span><h2>{selectedProduct.title}</h2>
          <div className="detail-price">{money(selectedProduct.price)}</div>
          <p>{selectedProduct.description || "A community marketplace listing available from a local seller."}</p>
          <div className="seller-box"><span><b>Seller</b><br/>{selectedProduct.seller}</span><span><b>Location</b><br/>{selectedProduct.location}</span></div>
          <div className="rating-panel"><b>★ {selectedProduct.rating || "New"}</b><span>{selectedProduct.reviewCount ? `${selectedProduct.reviewCount} reviews` : "No reviews yet"}</span></div>
          <div className="detail-actions"><button className="btn btn-secondary" onClick={()=>toggleSaved(selectedProduct)}>{saved.some(x=>x.id===selectedProduct.id)?"♥ Saved":"♡ Save"}</button><button className="btn btn-primary" onClick={()=>addToCart(selectedProduct)}>Add to cart</button></div>
        </div>
      </div>
    </div>}
  </>);
}
