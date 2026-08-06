# OneRoom Frontend — UI / Dizayn tizimi qo'llanmasi

> Bu hujjat `frontend/` kodining **haqiqiy holatidan** o'qib chiqarilgan (taxmin emas).
> Maqsad: yangi sahifa yoki komponent yozganda mavjud vizual tildan chetga chiqmaslik.
> Har bir qoida yonida uni qayerdan ko'chirib olish mumkinligi ko'rsatilgan.

---

## 1. Stack va asosiy fayllar

| Nima | Qayerda |
|---|---|
| Global CSS, tokenlar, glass utilitalari | [app/globals.css](app/globals.css) |
| Shrift ulanishi, `<html>`/`<body>` | [app/layout.tsx](app/layout.tsx) |
| Theme + Session provayderlar | [components/providers.tsx](components/providers.tsx) |
| Ilova karkasi (fon + sidebar + main + bottom nav) | [components/layout-switcher.tsx](components/layout-switcher.tsx) |
| Desktop sidebar (rail) | [components/navs/tor-nav.tsx](components/navs/tor-nav.tsx) |
| Mobil pastki nav | [components/navs/bottom-nav.tsx](components/navs/bottom-nav.tsx) |
| Sahifa sarlavhasi + qidiruv + bildirishnoma | [components/layout/top-header.tsx](components/layout/top-header.tsx) |
| Primitiv komponentlar (shadcn / base-ui) | [components/ui/](components/ui/) |
| Grafik ranglari | [hooks/use-chart-colors.ts](hooks/use-chart-colors.ts) |

**Kutubxonalar:** Tailwind CSS v4 (`@theme inline`, config fayli yo'q), `@base-ui/react` (shadcn v4 asosi),
`class-variance-authority`, `tailwind-merge` + `clsx` (`cn()` — [lib/utils.ts](lib/utils.ts)),
`lucide-react` (ikonkalar), `recharts` (grafiklar), `next-themes` (dark mode), `tw-animate-css`.

---

## 2. Dizayn tili — bir qarashda

Ilova ichki qismi (dashboard, panel) **"Glass Split"** deb nomlangan uslubda:

1. **Fon** — butun ekranga fixed qilib qo'yilgan ikki qatlam: tekis och-siyoh (`#eef2ff`) + uning ustida
   diagonal yashil-yorug'lik gradienti. Kontent skroll qilinganda fon joyida qoladi.
2. **Yuza (surface)** — hech qanday sahifa "oq quti" ishlatmaydi. Barcha panel, karta, sidebar,
   modal — **yarim shaffof + backdrop-blur** (frosted glass), ustida ingichka `border-white/60` chegara.
3. **Burchaklar juda yumaloq** — `rounded-2xl` (16px) va `rounded-3xl` (24px) asosiy o'lchov.
4. **Aksent rang — indigo**, muvaffaqiyat/pul — emerald/teal, xato — red, ogohlantirish — amber.
5. **Matn kichik va zich** — 10–15px oralig'idagi aniq piksel o'lchamlari, raqamlar `font-black`.

Bitta jumlada: **iOS/macOS uslubidagi yumshoq, shaffof, zich va indigo-aksentli admin panel.**

---

## 3. Rang tizimi

Loyihada **ikkita rang qatlami** parallel yashaydi. Buni bilish muhim — aks holda noto'g'ri joyda
noto'g'ri rang ishlatiladi.

### 3.1. Qatlam A — semantik tokenlar (OKLCH)

[app/globals.css](app/globals.css) da `:root` va `.dark` ichida. Bularni **`ui/` primitivlari**
(Button, Badge, Input, Select, Dialog...) ishlatadi.

**Light (`:root`)**

| Token | Qiymat | Nima |
|---|---|---|
| `--background` | `oklch(0.975 0.002 80)` | iliq oq-qum fon |
| `--foreground` | `oklch(0.11 0 0)` | deyarli qora matn |
| `--card` / `--popover` | `oklch(1 0 0)` | toza oq |
| `--primary` | `oklch(0.51 0.19 275)` | **indigo-violet** — asosiy aksent |
| `--primary-foreground` | `oklch(0.99 0 0)` | oq |
| `--secondary` / `--accent` | `oklch(0.96 0.002 80)` | juda och kulrang |
| `--muted` | `oklch(0.95 0.002 80)` | fon uchun kulrang |
| `--muted-foreground` | `oklch(0.5 0 0)` | ikkilamchi matn |
| `--destructive` | `oklch(0.55 0.22 27)` | qizil |
| `--border` / `--input` | `oklch(0.91 0.002 80)` | ingichka chegara |
| `--ring` | `oklch(0.62 0.15 275)` | fokus halqasi (indigo) |
| `--radius` | `0.75rem` (12px) | bazaviy radius |

**Dark (`.dark`)** — fon `oklch(0.12 0.002 260)` (sovuq ko'k-qora), karta `0.16`, chegara
`oklch(1 0 0 / 8%)` (ya'ni oq 8% shaffoflik — qattiq rang emas), primary biroz yorqinroq
`oklch(0.62 0.17 275)`.

**Radius shkalasi** `--radius` dan hosil qilinadi:
`sm = ×0.6`, `md = ×0.8`, `lg = ×1`, `xl = ×1.4`, `2xl = ×1.8`, `3xl = ×2.2`, `4xl = ×2.6`.

### 3.2. Qatlam B — to'g'ridan-to'g'ri Tailwind ranglari (amalda hukmron)

Sahifalar (dashboard, students, groups...) **semantik tokenlarni deyarli ishlatmaydi**.
Amaldagi statistika:

| Rang | Nechta joyda | Vazifasi |
|---|---|---|
| `indigo-*` | **299** | aktiv nav, avatar, fokus, asosiy tugma |
| `emerald-*` | **128** | to'lov, daromad, muvaffaqiyat |
| `teal-*` | 13 | "Barchasi →" havolalari, banner |
| `bg-primary` (token) | 8 | faqat `ui/` primitivlari ichida |

**Amaliy qoida:** sahifa yozayotganda **`indigo` / `emerald` / `amber` / `red` / `neutral`**
palitrasidan foydalaning — kod shunday yozilgan. `bg-primary` faqat `ui/` komponentlari ichida qolsin.

### 3.3. Semantik rang xaritasi (status ranglari)

Statuslar har doim **`Record<string, string>` xaritasi** orqali beriladi, `if/else` bilan emas.
Namuna — [app/(dashboard)/dashboard/page.tsx](app/(dashboard)/dashboard/page.tsx):

```ts
const LEAD_COLORS: Record<string, string> = {
  YANGI:          "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ALOQA_QILINGAN: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  SINOV_DARSI:    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  TO_LANDI:       "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  BEKOR:          "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};
const LEAD_LABELS: Record<string, string> = { YANGI: "Yangi", /* ... */ };
```

**Formula:** `bg-{rang}-100 text-{rang}-700` + dark uchun `dark:bg-{rang}-900/40 dark:text-{rang}-300`.

**Ma'no ↔ rang jadvali (loyihada qabul qilingan):**

| Ma'no | Rang |
|---|---|
| Yangi / neytral ma'lumot | `blue` |
| Faol / muvaffaqiyat / to'landi | `green` yoki `emerald` |
| Kutilmoqda / sinov / ogohlantirish | `amber` yoki `yellow` |
| Xato / qarz / o'chirish | `red` |
| Maxsus holat (sinov darsi) | `purple` |
| Bekor / arxiv / bo'sh | `neutral` |

---

## 4. Tipografiya

**Shrift: Plus Jakarta Sans** (`next/font/google`, `--font-jakarta` o'zgaruvchisi),
og'irliklar `300, 400, 500, 600, 700, 800`. `<html>` va `<body>` ga to'g'ridan-to'g'ri
`font-family: var(--font-jakarta)` qo'yilgan.

**O'lcham shkalasi — amalda kvadrat qavsdagi aniq piksellar ishlatiladi:**

| Class | Qayerda |
|---|---|
| `text-[10px]` | mikro-yorliq, nav label, badge, sana |
| `text-[11px]` | karta tagidagi izoh, "Barchasi →", jadval sarlavhasi |
| `text-[12px]` | ikkilamchi matn, form label |
| `text-[13px]` | **asosiy matn** — jadval kataklari, ro'yxat elementlari, tugmalar |
| `text-[15px]` | modal/blok sarlavhasi, logotip matni |
| `text-[22px]` | KPI raqami |
| `text-[40px]` | banner ichidagi katta raqam |

**Og'irliklar:**
- `font-black` (900) — **faqat raqamlar/summalar** uchun
- `font-bold` (700) — blok sarlavhalari
- `font-semibold` (600) — ism, muhim matn
- `font-medium` (500) — nav elementlari
- oddiy matn — og'irliksiz

**Mikro-yorliq patterni** (bo'lim nomi, jadval sarlavhasi):
```
text-[10px] font-bold uppercase tracking-wider text-neutral-400
```

**Matn rangi (dark bilan) — har doim juftlikda:**
- Asosiy: `text-neutral-900 dark:text-neutral-100`
- Ikkilamchi: `text-neutral-500 dark:text-neutral-400`
- Uchinchi darajali / placeholder: `text-neutral-400` (dark uchun o'zgarish shart emas)

---

## 5. "Glass Split" tizimi — eng muhim qism

### 5.1. Fon (ikki qatlam, fixed)

[components/layout-switcher.tsx](components/layout-switcher.tsx) ichida:

```tsx
<div className="app-bg-base  fixed inset-0 -z-20" />
<div className="app-bg-split fixed inset-0 -z-10" />
```

- `.app-bg-base` — light: `#eef2ff` (och indigo), dark: `#0d0e14`
- `.app-bg-split` — 100° burchakli diagonal gradient. Light: yashil (`16 185 129`) 0% → 7% → 16%.
  Dark: binafsha (`196 181 253`) 0 → 2.5% → 5.5%.
  `clip-path` + `blur` o'rniga **gradient** ishlatilgan — bir xil ko'rinish, lekin har kadrda
  filter hisoblanmaydi (tezlik uchun ataylab shunday).

### 5.2. Uchta yuza darajasi

| Class | Fon (light) | Blur | Qachon |
|---|---|---|---|
| `.glass-panel` | `rgba(255,255,255,0.55)` | 24px | **asosiy yuza** — kartalar, sidebar, header (76 ta joyda) |
| `.glass-soft` | `rgba(255,255,255,0.5)` | yo'q | panel **ichidagi** qatorlar, input, jadval sarlavhasi (64 ta joyda) |
| `.glass-strong` | `rgba(255,255,255,0.85)` | 28px | **suzuvchi** elementlar — modal, dropdown, qidiruv paneli (15 ta joyda) |

Dark rejimda: `glass-panel` → `rgba(255,255,255,0.05)`, `glass-soft` → `0.04`,
`glass-strong` → `rgba(20,18,26,0.88)`.

**Qoida:** blurni ichma-ich takrorlamang. Panel ichidagi qator `glass-soft` (blursiz) bo'lishi kerak,
aks holda brauzer ustma-ust blur hisoblab sekinlashadi.

### 5.3. Chegara — glass yuzaning ajralmas qismi

Glass yuza **har doim** shu chegara bilan yuradi:

```
border border-white/60 dark:border-white/10
```

Ichki ajratgichlar uchun: `border-white/50 dark:border-white/10`.

### 5.4. Tayyor kombinatsiya (eng ko'p uchraydigan qator)

```tsx
className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl"
```

Bu **karta yasashning standart yo'li**. `<Card>` komponentini emas, shu divni ishlating —
sahifalarda `Card` atigi 5 ta faylda import qilingan, `glass-panel` esa 76 marta.

---

## 6. Ilova karkasi (layout)

```
LayoutSwitcher
├── app-bg-base   (fixed, -z-20)
├── app-bg-split  (fixed, -z-10)
└── div.relative.flex.min-h-screen.gap-3.p-0.lg:gap-4.lg:p-4
    ├── <TorNav />       — desktop sidebar (lg dan boshlab)
    ├── <main>           — sahifa kontenti (mobil: pb-[80px])
    └── <BottomNav />    — mobil pastki nav (lg da yashirin)
```

- Desktop'da butun ilova **atrofida 16px bo'shliq** (`lg:p-4`) — ya'ni sidebar ham, kontent ham
  fonda "suzib" turadi, ekran chetiga yopishmaydi.
- Mobil'da bo'shliq yo'q (`p-0`), pastki nav esa `fixed bottom-3 left-3 right-3`.

### 6.1. Sidebar (TorNav)

- `sticky top-4`, balandligi `h-[calc(100dvh-32px)]`, `rounded-3xl`, `glass-panel`
- Ikki holat: ochiq `w-[220px]` / yig'ilgan `w-[76px]`, o'tish
  `transition: width 280ms cubic-bezier(0.4,0,0.2,1)` (`.rail-sidebar`)
- Yorliqlar ochilganda `rail-label-in` animatsiyasi bilan (180ms fade, 140ms kechikish bilan)
- Nav elementi holatlari:

```ts
const ACTIVE_ITEM = "bg-indigo-100/70 text-indigo-700 font-medium dark:bg-indigo-400/15 dark:text-indigo-200";
const IDLE_ITEM   = "text-neutral-500 hover:bg-white/60 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-neutral-100";
```

- Element balandligi `h-9`, radius `rounded-2xl`, ikonka `w-4 h-4` (yig'ilganda `w-5 h-5`)
- Bo'lim sarlavhasi: `text-[10px] font-bold uppercase tracking-wider text-neutral-400`
- Chiqish tugmasi qizil: `text-red-500 hover:bg-red-50/70 dark:hover:bg-red-900/20`

### 6.2. Mobil nav (BottomNav)

- `glass-strong fixed bottom-3 left-3 right-3 rounded-3xl shadow-xl`
- 4 ta doimiy element + "Ko'proq" tugmasi
- Aktiv element: ikonka `bg-indigo-100/80` pill (`w-10 h-6 rounded-full`) ichida, `stroke-[2.5]`
- "Ko'proq" bosilganda: `fixed bottom-[88px]` da `glass-strong rounded-3xl` varaq + orqa fon `bg-black/40`

### 6.3. TopHeader

Har bir sahifa **`<TopHeader title subtitle action />`** bilan boshlanadi, keyin
`<div className="p-5 space-y-5">` ichida kontent. Bu qat'iy konventsiya — barcha sahifada bir xil.

---

## 7. Komponent patternlari (ko'chirib olish uchun)

### 7.1. KPI statistika kartasi

Grid: `grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3` (yoki `md:grid-cols-4`)

```tsx
<div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-indigo-50 dark:bg-indigo-950/40">
    <Icon className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
  </div>
  <p className="text-[22px] font-black text-neutral-900 dark:text-neutral-100 leading-none">{value}</p>
  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{title}</p>
  <p className="text-[10px] font-semibold mt-0.5 text-emerald-500">+12 bu oy</p>
</div>
```

Ikonka konteyneri rangi har KPI uchun boshqacha: `indigo → emerald → amber → pink → violet → teal`
(fon `-50 / dark:-950/40`, ikonka `-600 / dark:-400`).

### 7.2. Ro'yxatli panel (sarlavha + qatorlar)

```tsx
<div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
  {/* Sarlavha */}
  <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/50 dark:border-white/10">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">So'nggi lidlar</h3>
    </div>
    <a href="/leads" className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline">
      Barchasi →
    </a>
  </div>

  {/* Qator */}
  <div className="flex items-center gap-3 px-5 py-3 border-b border-white/50 dark:border-white/10 last:border-0
                  hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
    ...
  </div>
</div>
```

`overflow-hidden` **majburiy** — aks holda qatorlar yumaloq burchakdan chiqib ketadi.

### 7.3. Avatar (gradientli harf)

Rasm yo'q — ism bosh harfi gradient kvadratda:

```tsx
<div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[12px] font-bold shrink-0
                bg-gradient-to-br from-indigo-400 to-violet-500">
  {name[0]}
</div>
```

Kontekstga qarab gradient o'zgaradi:
- O'quvchi (faol): `from-blue-400 to-indigo-500`
- O'quvchi (nofaol): `from-amber-400 to-orange-400`
- To'lov: `from-emerald-400 to-teal-500`
- Foydalanuvchi (sidebar): tekis `bg-indigo-500`, `rounded-full`

### 7.4. Status badge

```tsx
<span className={cn("text-[10px] px-2 py-0.5 rounded-lg font-semibold shrink-0",
  LEAD_COLORS[status] ?? "bg-neutral-100 text-neutral-600")}>
  {LEAD_LABELS[status] ?? status}
</span>
```

Kichikroq variant: `text-[10px] px-1.5 py-0.5 rounded-full`.

### 7.5. Filtr chiplari (segmented)

```tsx
<button className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
  active
    ? "bg-indigo-600 text-white dark:bg-indigo-500 border-neutral-900"
    : "glass-panel text-neutral-600 dark:text-neutral-400 border-white/60 dark:border-white/10 hover:border-neutral-400"
)}>
  {label}
</button>
```

### 7.6. Jadval

`ui/table.tsx` komponentlari + glass o'rami:

```tsx
<div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow className="glass-soft hover:bg-white/60 dark:hover:bg-white/10">
          <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            O'quvchi
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow className="hover:bg-white/60 dark:hover:bg-white/10 transition-colors">...</TableRow>
      </TableBody>
    </Table>
  </div>
</div>
```

`overflow-x-auto` — mobil uchun majburiy.
`globals.css` jadval uchun global qoidalar ham beradi (`thead tr` foni, qator hover, `tbody tr + tr`
ajratgich) — ular avtomatik ishlaydi, qo'shimcha class shart emas.

### 7.7. Modal

[components/ui/modal.tsx](components/ui/modal.tsx) dan `<Modal>` ishlating, qo'lda yasamang:

- Panel: `glass-strong rounded-2xl shadow-2xl border border-white/60 dark:border-white/10`
- Uch qism: sarlavha (`border-b`) → skroll qilinadigan tana (`p-4 sm:p-5 space-y-4`) → futer
- Futer mobil'da **teskari ustun** (`flex-col-reverse sm:flex-row`) — asosiy amal pastda turadi
- Skrollbar maxsus: 1.5px kenglik, `rounded-full`, `bg-neutral-300 dark:bg-neutral-600`
- O'lchamlar: `sm | md | lg` → `sm:max-w-sm | md | lg`

O'chirish tasdig'i uchun alohida `<ConfirmDeleteModal>` bor — qizil doiradagi ikonka, markazlashtirilgan
matn, ikkita teng tugma.

### 7.8. Form maydoni

[components/ui/form-field.tsx](components/ui/form-field.tsx):

- Label: `text-[12px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400`
- Majburiy: qizil `*`
- Xato: `AlertCircle` ikonka + `text-[11px] font-medium text-red-500`, input chegarasi avtomatik qizaradi
- Hint: `text-[11px] text-neutral-400` (xato bo'lsa hint ko'rsatilmaydi)

### 7.9. Skeleton (yuklanish)

Har sahifada **lokal** kichik komponent sifatida takrorlanadi:

```tsx
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}
```

Qoida: **spinner emas, skeleton**. Yuklanayotgan ro'yxat uchun `Array.from({length: 4})` bilan
haqiqiy qator tuzilishini takrorlang (avatar doirasi + ikki chiziq + badge).

### 7.10. Bo'sh holat (empty state)

```tsx
<div className="py-10 text-center text-sm text-neutral-400">Hali lid yo'q</div>
```

Sodda, rasmsiz, bitta jumla.

### 7.11. Ogohlantirish banneri

```tsx
<div className="flex items-center gap-3 px-4 py-3 rounded-xl
                bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
  <p className="text-sm text-red-700 dark:text-red-300">...</p>
  <a className="ml-auto text-xs font-semibold text-red-600 hover:underline shrink-0">Ko'rish →</a>
</div>
```

Bu **glass emas** — ataylab qattiq rangli, chunki diqqatni tortishi kerak.

### 7.12. Rangli banner (accent blok)

Monotonlikni buzish uchun bitta to'q rangli blok:

```tsx
<div className="bg-teal-600 text-white rounded-2xl p-5 flex items-center gap-4">
  <p className="text-teal-200 text-[11px] font-semibold uppercase tracking-wider">Jami o'quvchi</p>
  <p className="text-[40px] font-black leading-none mt-1">{count}</p>
  <Icon className="w-14 h-14 text-white/20 shrink-0" />
</div>
```

Katta ikonka `text-white/20` — dekorativ "vodyanoy znak" sifatida.

---

## 8. Grafiklar (Recharts)

Ranglar **doim** [hooks/use-chart-colors.ts](hooks/use-chart-colors.ts) dan olinadi (dark mode'ga moslashadi):

| Kalit | Light | Dark |
|---|---|---|
| `grid` | `#dbe0f5` | `#2a2a33` |
| `axis` | `#9ca3af` | `#525252` |
| `tooltip` | `#ffffff` | `#171717` |
| `tooltipBorder` | `#c7d2fe` | `#3f3f52` |
| `tooltipText` | `#111827` | `#e5e5e5` |

**Standart AreaChart sozlamalari:**
- `CartesianGrid strokeDasharray="3 3" vertical={false}` — faqat gorizontal chiziqlar
- `XAxis/YAxis`: `axisLine={false} tickLine={false}`, `tick={{ fontSize: 12, fill: chart.axis }}`
- Asosiy seriya: `stroke="#818cf8"` (indigo-400) + `linearGradient` to'ldirish (0.35 → 0), `strokeWidth={2.5}`
- Ikkilamchi seriya: `stroke="#f87171"`, `fill="none"`, `strokeDasharray="6 3"`, `strokeWidth={1.5}`
- Tooltip: `borderRadius: 10`
- Balandlik `200`, `<ResponsiveContainer width="100%">`

Legenda qo'lda yasaladi (Recharts `<Legend>` emas):
```tsx
<span className="w-6 h-0.5 bg-teal-500 block rounded-full" />Kirim
```

---

## 9. Dark mode

- `next-themes`, `attribute="class"`, `defaultTheme="light"`, `enableSystem` —
  [components/providers.tsx](components/providers.tsx)
- Tailwind varianti: `@custom-variant dark (&:is(.dark *))`
- **Qoida:** dark'da qattiq kulrang emas, **oq shaffoflik** ishlating:
  `dark:bg-white/10`, `dark:border-white/10`, `dark:hover:bg-white/10`
- Rangli fonlar dark'da: `bg-{c}-50` → `dark:bg-{c}-950/40` (yoki `-900/30`, `-900/40`)
- Rangli matn dark'da: `text-{c}-600` → `dark:text-{c}-400`
- Grafik/`useChartColors` — `mounted` tekshiruvi bor, SSR mos kelmasligining oldini oladi

---

## 10. Ikonkalar

- **Faqat `lucide-react`**, boshqa ikonka to'plami ishlatilmaydi
- O'lchamlar: `w-3.5 h-3.5` (badge/kichik konteyner), `w-4 h-4` (**standart**),
  `w-5 h-5` (nav, yig'ilgan sidebar), `w-14 h-14` (dekorativ)
- Ikonka har doim `shrink-0`
- Ikonka konteyneri: `w-7 h-7 rounded-lg` (kichik) yoki `w-9 h-9 rounded-xl` (KPI)

---

## 11. Harakat va o'tishlar

- **Global:** `globals.css` barcha elementga `background-color, border-color, color, fill, stroke`
  bo'yicha `150ms ease` o'tish beradi. Ya'ni hover ranglari uchun `transition-colors` yozish
  ortiqcha, lekin kodda odat bo'yicha baribir yoziladi.
- Sidebar kengligi: `280ms cubic-bezier(0.4,0,0.2,1)`
- `rail-label-in`: `180ms ease 140ms both` (yorliq kechikib paydo bo'ladi)
- Tugma bosilganda: `active:translate-y-px` (`ui/button.tsx`)
- Skeleton: `animate-pulse`
- Spinner (faqat tugma ichida): `w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin`

---

## 12. Primitivlar (`components/ui/`) haqida

shadcn v4 + `@base-ui/react` asosida. Ular semantik tokenlarni ishlatadi va **`data-slot`**
atributlari bilan belgilanadi (`data-slot="button"`, `data-slot="card"` ...) —
`globals.css` shu selektorlar orqali global uslub beradi.

**Button** — `cva` variantlari: `default | outline | secondary | ghost | destructive | link`,
o'lchamlari: `xs(h-6) | sm(h-7) | default(h-8) | lg(h-9) | icon | icon-xs | icon-sm | icon-lg`.
E'tibor bering: tugmalar **past** (32px) — bu zich admin panel uchun ataylab.

**Badge** — `h-5 rounded-4xl` (to'liq pill), variantlari Button bilan bir xil nomlangan.
`destructive` varianti to'q emas — `bg-destructive/10 text-destructive` (yumshoq).

**Card** — `globals.css` uni majburan glass yuzaga aylantiradi:
```css
[data-slot="card"] {
  background-color: rgba(255,255,255,0.55) !important;
  backdrop-filter: blur(24px) !important;
  border-radius: 24px !important;
  box-shadow: none !important;
}
```

---

## 13. Landing sahifasi — alohida dizayn tili (ehtiyot bo'ling)

[app/page.tsx](app/page.tsx) + [components/landing/](components/landing/) — bu **ilova ichidan butunlay
boshqacha** uslubda:

| | Ilova ichi | Landing |
|---|---|---|
| Fon | `#eef2ff` + diagonal gradient | `bg-gradient-to-b from-blue-50/80 via-white to-white` + blur "glow" doiralar |
| Yuza | glass (shaffof + blur) | qattiq oq + `border-slate-200` + `shadow-2xl` |
| Aksent | `indigo-600` | `blue-600` |
| Matn rangi | `neutral-*` | `slate-*` |
| Radius | `rounded-2xl/3xl` | `rounded-xl/2xl` |
| Matn o'lchami | `text-[13px]` aniq px | `text-sm/base/lg` + `sm:` breakpointlar |
| Soyalar | deyarli yo'q | `shadow-lg shadow-blue-600/20` |

Landing bo'limlari: Header → Hero (brauzer chrome ichidagi dashboard maketi bilan) → Stats →
Features → HowItWorks → Pricing → Testimonials → FAQ → CTA → Footer.

**Qoida:** landing komponentini tahrirlayotganda `slate` + `blue` + `shadow` tilida qoling,
ilova sahifasini tahrirlayotganda `neutral` + `indigo` + `glass` tilida qoling. Ikkisini aralashtirmang.

---

## 14. Ma'lum "gotcha"lar (kodda bor, bilib qo'yish kerak)

1. **`--font-sans` aniqlanmagan.** `@theme inline` da `--font-sans: var(--font-sans)` — o'z-o'ziga
   havola. Shu sababli `font-sans` va `font-heading` utilitalari hech narsa qilmaydi; shrift
   `html/body` dagi to'g'ridan-to'g'ri `font-family` orqali keladi. Zarar yo'q, lekin
   `font-heading` bilan boshqa shrift kutmang. `--font-mono: var(--font-geist-mono)` ham
   aniqlanmagan.

2. **"VARIANT SYSTEM" o'lik kod.** `globals.css:138-209` dagi `--v-*` o'zgaruvchilar izohda
   "JS (useVariant hook) tomonidan o'rnatiladi" deyilgan, lekin kodda **`useVariant` yo'q** —
   grep 0 natija beradi. Ya'ni faqat fallback qiymatlar ishlaydi, va ularning ustidan pastroqdagi
   ikkinchi `[data-slot="card"]` bloki `!important` bilan yozib ketadi. Yangi karta uslubi kerak
   bo'lsa **pastki blokni** o'zgartiring, `--v-*` ni emas.

3. **`[data-slot="card"]` ikki marta aniqlangan** (166 va 274-qatorlar). Kuchga kiradigani —
   ikkinchisi.

4. **`Card` komponenti amalda deyarli ishlatilmaydi** (5 fayl) — sahifalar `glass-panel` divlarini
   ishlatadi (76 joyda). Yangi sahifada ham shu yo'ldan boring, aks holda ikki xil karta ko'rinishi
   paydo bo'ladi.

5. **Chart uchun `--chart-1..5` tokenlari mavjud, lekin ishlatilmaydi** — grafiklar qattiq hex
   ranglar (`#818cf8`, `#f87171`) va `useChartColors` dan foydalanadi.

---

## 15. Yangi sahifa yozish — tayyor karkas

```tsx
"use client";

import { TopHeader } from "@/components/layout/top-header";
import { cn } from "@/lib/utils";
import { useBranch } from "@/lib/contexts/branch-context";
import { SomeIcon } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const STATUS_CFG: Record<string, string> = {
  FAOL: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  // ...
};

export default function MyPage() {
  const { activeBranch } = useBranch();

  return (
    <div>
      <TopHeader
        title="Sahifa nomi"
        subtitle={activeBranch?.name}
        action={{ label: "Yangi qo'shish", onClick: () => {} }}
      />

      <div className="p-5 space-y-5">
        {/* 1. KPI qatori */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* 7.1 dagi karta */}
        </div>

        {/* 2. Filtrlar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* 7.5 dagi chiplar */}
          <span className="ml-auto text-xs text-neutral-400">{count} ta</span>
        </div>

        {/* 3. Asosiy kontent — jadval yoki ro'yxat */}
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
          {/* 7.2 yoki 7.6 */}
        </div>
      </div>
    </div>
  );
}
```

---

## 16. Tez tekshiruv ro'yxati (PR oldidan)

- [ ] Sahifa `<TopHeader>` bilan boshlanadimi va kontent `p-5 space-y-5` ichidami?
- [ ] Har bir karta `glass-panel border border-white/60 dark:border-white/10 rounded-2xl` mi?
- [ ] Ichki qatorlar `glass-soft` (blursiz) mi — ichma-ich blur yo'qmi?
- [ ] Har bir rang klassining `dark:` juftligi bormi?
- [ ] Statuslar `Record` xaritasi orqali berilganmi, `if/else` bilan emasmi?
- [ ] Yuklanish holati skeleton bilanmi (spinner emas)?
- [ ] Bo'sh holat uchun matn bormi?
- [ ] Ikonkalar `lucide-react` dan va `shrink-0` bilanmi?
- [ ] Raqamlar `font-black`, matn o'lchamlari `text-[11px]/[13px]` shkalasidami?
- [ ] Jadval `overflow-x-auto` ichidami?
- [ ] Mobil'da pastki nav ostida qolmaydimi (`pb-[80px]` main'da bor)?
