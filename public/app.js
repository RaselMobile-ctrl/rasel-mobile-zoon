let products=[],settings={},category="all";
const $=s=>document.querySelector(s);
const money=n=>"৳ "+Number(n||0).toLocaleString("en-BD");
async function load(){
 try{
  const [p,s,b]=await Promise.all([fetch("/api/products").then(r=>r.json()),fetch("/api/settings").then(r=>r.json()),fetch("/api/brands").then(r=>r.json())]);
  products=p;settings=s;
  const paymentSelect = document.querySelector('[name="payment_method"]');
  paymentSelect.innerHTML = '<option value="Cash on Delivery">Cash on Delivery</option>' +
    (s.bkash ? '<option value="bKash">bKash (ম্যানুয়াল)</option>' : '') +
    (s.nagad ? '<option value="Nagad">Nagad (ম্যানুয়াল)</option>' : '');
  paymentSelect.onchange = updatePaymentInstructions;
  updatePaymentInstructions();
  $("#brandFilter").innerHTML='<option value="">সব ব্র্যান্ড</option>'+b.map(x=>`<option>${esc(x.name)}</option>`).join("");
  $("#callBtn").href="tel:"+(s.phone||"01788102096");
  const wa=(s.whatsapp||"01788102096").replace(/\D/g,"");
  $("#waBtn").href="https://wa.me/"+(wa.startsWith("88")?wa:"88"+wa);
  document.querySelector(".brand b").textContent=s.shop_name||"RASEL MOBILE ZOON";
  if(s.logo){$("#brandLogo").innerHTML=`<img src="${esc(s.logo)}" alt="Shop logo">`;$("#brandLogo").classList.add("has-logo")}
  if(s.banner){$("#heroBanner").style.backgroundImage=`linear-gradient(90deg,#090909e8,#09090988),url("${String(s.banner).replace(/[\"\\]/g,"")}")`;$("#heroBanner").style.backgroundSize="cover";$("#heroBanner").style.backgroundPosition="center"}
  render();
 }catch(e){$("#products").innerHTML='<div class="empty">প্রোডাক্ট লোড করা যায়নি। পরে আবার চেষ্টা করুন।</div>'}
}
function updatePaymentInstructions(){
 const method = document.querySelector('[name="payment_method"]').value;
 const box = $("#paymentInstructions");
 if(method === "bKash" && settings.bkash) box.textContent = `bKash নম্বরে টাকা পাঠান: ${settings.bkash}। পেমেন্টের TrxID অতিরিক্ত তথ্য ঘরে লিখুন। অ্যাডমিন ম্যানুয়ালি যাচাই করবেন।`;
 else if(method === "Nagad" && settings.nagad) box.textContent = `Nagad নম্বরে টাকা পাঠান: ${settings.nagad}। পেমেন্টের TrxID অতিরিক্ত তথ্য ঘরে লিখুন। অ্যাডমিন ম্যানুয়ালি যাচাই করবেন।`;
 else box.textContent = "Cash on Delivery: পণ্য হাতে পেয়ে টাকা পরিশোধ করুন।";
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function render(){
 const q=$("#search").value.toLowerCase(),brand=$("#brandFilter").value;
 const list=products.filter(p=>(category==="all"||p.category===category)&&(!brand||p.brand===brand)&&(`${p.name} ${p.brand}`.toLowerCase().includes(q)));
 $("#products").innerHTML=list.length?list.map(p=>`<article class="product"><div class="product-img">${p.image1?`<img src="${esc(p.image1)}" alt="${esc(p.name)}">`:"📱"}</div>${(p.image2||p.image3)?`<div class="product-thumbs">${[p.image2,p.image3].filter(Boolean).map(src=>`<img src="${esc(src)}" alt="${esc(p.name)} additional view">`).join("")}</div>`:""}<div class="product-info"><span class="tag">${p.category==="used"?"USED PHONE":"NEW PHONE"} · ${esc(p.brand)}</span><h3>${esc(p.name)}</h3><div class="spec">${esc(p.ram)} ${p.ram&&p.storage?" / ":""} ${esc(p.storage)} ${p.condition_text?"· "+esc(p.condition_text):""}</div><div class="price">${money(p.price)}</div><button class="gold-btn" onclick="openOrder('${p.id}')">অর্ডার করুন →</button></div></article>`).join(""):'<div class="empty">এখনো কোনো ফোন যোগ করা হয়নি। শিগগিরই আসছে!</div>';
}
window.openOrder=id=>{const p=products.find(x=>x.id===id);if(!p)return;$("#productId").value=id;$("#modalProduct").textContent=p.name+" — "+money(p.price);$("#orderMessage").textContent="";$("#orderModal").classList.remove("hidden")};
$("#closeModal").onclick=()=>$("#orderModal").classList.add("hidden");
$("#orderModal").addEventListener("click",e=>{if(e.target.id==="orderModal")$("#orderModal").classList.add("hidden")});
$("#orderForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),data=Object.fromEntries(f.entries());data.product_id=$("#productId").value;$("#orderMessage").textContent="অর্ডার পাঠানো হচ্ছে...";try{const r=await fetch("/api/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});const d=await r.json();$("#orderMessage").textContent=d.message||d.error||"সমস্যা হয়েছে";if(r.ok){e.target.reset();updatePaymentInstructions()}}catch{$("#orderMessage").textContent="ইন্টারনেট সংযোগ পরীক্ষা করুন"}};
document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");category=b.dataset.cat;render()});
$("#search").oninput=render;$("#brandFilter").onchange=render;$("#year").textContent=new Date().getFullYear();load();