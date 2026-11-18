# RASEL MOBILE ZOON — প্রাথমিক ওয়েবসাইট

এটি একটি প্রথম MVP starter project: পাবলিক মোবাইল শোরুম, আলাদা `/admin` প্যানেল, Cloudflare Worker API, D1 database; ছবি external image URL দিয়ে দেখানো হবে।

## গুরুত্বপূর্ণ
- এখনো লাইভ নয়; Cloudflare resources ও secrets সেটআপ না করা পর্যন্ত কাজ করবে না।
- প্রথমে Cloudflare D1 database তৈরি করতে হবে। R2 ব্যবহার করা হয় না, তাই R2 subscription বা payment method লাগবে না।
- `wrangler.jsonc`-এর `database_id`-এ আপনার D1 ID বসাতে হবে।
- Cloudflare Worker secrets হিসেবে `ADMIN_PASSWORD` এবং `SESSION_SECRET` সেট করতে হবে।
- `ADMIN_PASSWORD`-এ শক্তিশালী আলাদা পাসওয়ার্ড দিন; কারও সঙ্গে শেয়ার করবেন না।
- `SESSION_SECRET` কমপক্ষে 32 random characters হওয়া উচিত।
- স্বয়ংক্রিয় Merchant Payment Gateway যোগ করা হয়নি: সাধারণত এতে সেটআপ/প্রতি-লেনদেন ফি থাকে। SSLCOMMERZ-এর প্রকাশিত Basic মূল্য ৳২৫,৫০০ এককালীন এবং সফল লেনদেনে ২.৫%। bKash/Nagad কেবল অ্যাডমিন নম্বর সেট করলে ম্যানুয়াল পেমেন্ট হিসেবে দেখা যাবে; ক্রেতাকে TrxID লিখতে হবে এবং অ্যাডমিন নিজে যাচাই করবেন।
- অর্ডার নোটিফিকেশন এই প্রথম সংস্করণে অ্যাডমিন প্যানেলের অর্ডার তালিকায় দেখা যাবে; push/email/sound notification পরের ধাপে যোগ করা হবে।
- Public website-এ ফোনের ছবি, দাম ও অর্ডার দেখা যাবে; Admin panel server-side signed session দিয়ে সুরক্ষিত।
- Admin থেকে প্রোডাক্ট যোগ, এডিট ও ডিলিট; তিনটি পণ্যের ছবি, ব্যানার ও লোগোর জন্য সরাসরি image URL দেওয়া যাবে; এই বিনামূল্যের সংস্করণে ফাইল আপলোড নেই।
- এই starter-এ এখনো আলাদা category/brand CRUD, customer order tracking page, live push/email notification, stock auto-decrement, এবং স্বয়ংক্রিয় bKash/Nagad merchant API integration নেই; এগুলো পরের development step।

## Cloudflare setup outline
1. D1 database তৈরি: `rasel-mobile-zoon-db`
2. D1 Console-এ `schema.sql` চালান।
3. Worker-এর D1 binding name `DB` নিশ্চিত করুন। R2 binding নেই।
4. Worker secrets: `ADMIN_PASSWORD`, `SESSION_SECRET` সেট করুন। `SESSION_SECRET` দীর্ঘ ও অনুমান-অযোগ্য random value হতে হবে।
5. `wrangler.jsonc`-এ D1 database_id বসানো আছে।
6. এই ফোল্ডারের ফাইলগুলো GitHub repository root-এ আপলোড করুন।
7. Cloudflare Workers & Pages-এ Git integration build settings আপনার নির্বাচিত deployment method অনুযায়ী সেট করুন। Wrangler CLI deployment হলে `npx wrangler deploy` ব্যবহার করুন।

## প্রথম লগইন
`https://আপনার-worker-domain/admin`

প্রথমবার লগইন করার আগে `ADMIN_PASSWORD` সেট করা আবশ্যক।
