const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type, authorization"
};

function withCors(response) {
  const h = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders)) h.set(k, v);
  return new Response(response.body, { status: response.status, headers: h });
}

const uid = () => crypto.randomUUID();

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
}

async function makeSession(env) {
  const payload = btoa(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000 }));
  return `${payload}.${await sign(payload, env.SESSION_SECRET)}`;
}

async function isAdmin(request, env) {
  const cookie = request.headers.get("cookie") || "";
  const token = cookie.split(";").map(x => x.trim()).find(x => x.startsWith("rmz_admin="))?.slice(10);
  if (!token || !env.SESSION_SECRET) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || await sign(payload, env.SESSION_SECRET) !== sig) return false;
  try { return JSON.parse(atob(payload)).exp > Date.now(); } catch { return false; }
}

async function body(request) {
  try { return await request.json(); } catch { return {}; }
}

async function api(request, env, url) {
  const path = url.pathname;
  const method = request.method;

  if (method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (path === "/api/health") return json({ ok: true, shop: "RASEL MOBILE ZOON" });

  if (path === "/api/products" && method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC"
    ).all();
    return json(results);
  }

  if (path === "/api/brands" && method === "GET") {
    const { results } = await env.DB.prepare("SELECT * FROM brands ORDER BY name").all();
    return json(results);
  }

  if (path === "/api/settings" && method === "GET") {
    const { results } = await env.DB.prepare("SELECT key, value FROM settings").all();
    return json(Object.fromEntries(results.map(x => [x.key, x.value])));
  }

  if (path === "/api/orders" && method === "POST") {
    const b = await body(request);
    if (!b.product_id || !b.customer_name || !b.phone || !b.address) {
      return json({ error: "নাম, ফোন নম্বর ও ঠিকানা পূরণ করুন।" }, 400);
    }
    const product = await env.DB.prepare("SELECT id, name, stock FROM products WHERE id = ? AND active = 1")
      .bind(b.product_id).first();
    if (!product) return json({ error: "এই পণ্যটি পাওয়া যাচ্ছে না।" }, 404);
    const id = uid();
    await env.DB.prepare(
      `INSERT INTO orders (id, product_id, product_name, customer_name, phone, address, quantity, payment_method, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, product.id, product.name, String(b.customer_name).slice(0,100),
      String(b.phone).slice(0,30), String(b.address).slice(0,500),
      Math.max(1, Math.min(20, Number(b.quantity) || 1)),
      String(b.payment_method || "Cash on Delivery").slice(0,50),
      String(b.note || "").slice(0,500)).run();
    return json({ ok: true, order_id: id, message: "আপনার অর্ডার গ্রহণ করা হয়েছে।" }, 201);
  }

  if (path === "/api/admin/login" && method === "POST") {
    const b = await body(request);
    if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({ error: "অ্যাডমিন সিক্রেট সেটআপ করা হয়নি।" }, 503);
    if (String(b.password || "") !== env.ADMIN_PASSWORD) return json({ error: "পাসওয়ার্ড সঠিক নয়।" }, 401);
    const token = await makeSession(env);
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "content-type": "application/json",
        "set-cookie": `rmz_admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`
      }
    });
  }

  if (path === "/api/admin/logout" && method === "POST") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json", "set-cookie": "rmz_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0" }
    });
  }

  if (path.startsWith("/api/admin/")) {
    if (!(await isAdmin(request, env))) return json({ error: "অনুমতি নেই। আবার লগইন করুন।" }, 401);

    if (path === "/api/admin/orders" && method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 300").all();
      return json(results);
    }

    if (path === "/api/admin/orders" && method === "PUT") {
      const b = await body(request);
      await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?")
        .bind(String(b.status || "New").slice(0,40), b.id).run();
      return json({ ok: true });
    }

    if (path === "/api/admin/products" && method === "POST") {
      const b = await body(request);
      if (!b.name) return json({ error: "ফোনের নাম দিন।" }, 400);
      const id = uid();
      await env.DB.prepare(
        `INSERT INTO products (id,name,brand,category,price,old_price,condition_text,ram,storage,description,image1,image2,image3,stock,active)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`
      ).bind(id, b.name, b.brand || "", b.category || "new", Number(b.price)||0,
        b.old_price ? Number(b.old_price) : null, b.condition_text || "", b.ram || "",
        b.storage || "", b.description || "", b.image1 || "", b.image2 || "",
        b.image3 || "", Number(b.stock)||0).run();
      return json({ ok: true, id }, 201);
    }

    if (path.startsWith("/api/admin/products/") && method === "PUT") {
      const id = path.split("/").pop();
      const b = await body(request);
      if (!b.name) return json({ error: "ফোনের নাম দিন।" }, 400);
      await env.DB.prepare(
        `UPDATE products SET name=?, brand=?, category=?, price=?, old_price=?, condition_text=?,
         ram=?, storage=?, description=?, image1=COALESCE(NULLIF(?,''),image1),
         image2=COALESCE(NULLIF(?,''),image2), image3=COALESCE(NULLIF(?,''),image3), stock=?
         WHERE id=?`
      ).bind(b.name, b.brand || "", b.category || "new", Number(b.price)||0,
        b.old_price ? Number(b.old_price) : null, b.condition_text || "", b.ram || "",
        b.storage || "", b.description || "", b.image1 || "", b.image2 || "", b.image3 || "",
        Number(b.stock)||0, id).run();
      return json({ ok: true, id });
    }

    if (path.startsWith("/api/admin/products/") && method === "DELETE") {
      const id = path.split("/").pop();
      await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
      return json({ ok: true });
    }

    if (path === "/api/admin/settings" && method === "POST") {
      const b = await body(request);
      const allowed = ["shop_name","phone","whatsapp","banner","logo","notice","bkash","nagad"];
      for (const key of allowed) {
        if (typeof b[key] === "string") {
          await env.DB.prepare("INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
            .bind(key, b[key].slice(0,2000)).run();
        }
      }
      return json({ ok: true });
    }

    if (path === "/api/admin/upload" && method === "POST") {
      const form = await request.formData();
      const file = form.get("file");
      if (!file || typeof file === "string") return json({ error: "ছবি নির্বাচন করুন।" }, 400);
      if (!["image/png","image/jpeg","image/webp"].includes(file.type)) return json({ error: "PNG, JPG অথবা WebP ছবি দিন।" }, 400);
      if (file.size > 5 * 1024 * 1024) return json({ error: "ছবির সাইজ ৫ MB-এর কম হতে হবে।" }, 400);
      const key = `uploads/${uid()}`;
      await env.IMAGES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
      return json({ ok: true, key, url: `/media/${key}` });
    }
  }

  if (path.startsWith("/media/") && method === "GET") {
    const key = path.slice("/media/".length);
    const object = await env.IMAGES.get(key);
    if (!object) return new Response("Not found", { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=86400");
    return new Response(object.body, { headers });
  }

  return json({ error: "Not found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/media/")) {
      try { return withCors(await api(request, env, url)); }
      catch (e) { return withCors(json({ error: "সার্ভারে সমস্যা হয়েছে। লগ বা Cloudflare সেটআপ পরীক্ষা করুন।" }, 500)); }
    }
    return env.ASSETS.fetch(request);
  }
};
