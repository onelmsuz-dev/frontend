# Blog materiallarini qo‘shish

1. `marketing/AGENTS.md` va kontent reyestri asosida dublikat tekshiruvini bajaring.
2. Maqola matnini shu katalogga `{ "markdown": "..." }` ko‘rinishidagi JSON fayl qilib qo‘shing. Qo‘llanadigan formatlar: H1, H2, paragraflar, HTTPS havolalar va jadval. HTML ishlatilmaydi.
3. `lib/blog/posts.ts` ichida import qilib `posts` ro‘yxatining boshiga metadata bilan qo‘shing. Sana haqiqiy nashr sanasi bo‘lsin; mualliflikni to‘qimang.
4. Muqovani `public/blog/` ga qo‘ying. 1600×900 tavsiya qilinadi; mazmunli alt yozing.
5. Blog kartochkasi, maqola sahifasi, metadata va sitemap avtomatik yaratiladi. Lokal va production holatini kontent reyestrida alohida yuriting.
