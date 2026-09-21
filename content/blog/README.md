# Blog materiallarini qo‘shish

1. `marketing/AGENTS.md` va kontent reyestri asosida dublikat tekshiruvini bajaring.
2. Maqola matnini shu katalogga `{ "markdown": "..." }` ko‘rinishidagi JSON fayl qilib qo‘shing. Qo‘llanadigan formatlar: H1, H2, paragraflar, HTTPS havolalar va jadval. HTML ishlatilmaydi.
   Sayt uch tilli (o‘zbekcha — asosiy, ruscha, inglizcha): har bir maqola uchta fayl bo‘ladi — `nom.json` (uz), `nom.ru.json`, `nom.en.json`. Ichki havolalar mos tildagi sahifaga ishora qilsin (`https://www.oneroom.uz/ru/tolovlar`, `https://www.oneroom.uz/en/tolovlar`). Ruscha/inglizcha matn — tabiiy tarjima, mashina tarjimasi emas.
3. `lib/blog/posts.ts` ichida uchala faylni import qilib `RAW` ro‘yxatining boshiga qo‘shing: `slug`, `date`, `image` umumiy, `text.uz/ru/en` ichida sarlavha, tavsif, kategoriya, sana matni, rasm alt matni va `markdown`. Manzil (`slug`) uch tilda bir xil. Sana haqiqiy nashr sanasi bo‘lsin; mualliflikni to‘qimang.
4. Muqovani `public/blog/` ga qo‘ying. 1600×900 tavsiya qilinadi; mazmunli alt yozing.
5. Blog kartochkasi, maqola sahifasi, metadata va sitemap avtomatik yaratiladi. Lokal va production holatini kontent reyestrida alohida yuriting.
