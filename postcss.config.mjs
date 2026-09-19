import fontScale from "./scripts/postcss-font-scale.mjs";

/**
 * Turbopack plagin NOMINI o'z chunk papkasidan qidiradi — ya'ni
 * `"./scripts/postcss-font-scale.mjs"` deb yozilsa `Cannot find module`
 * bo'ladi. Shuning uchun plagin OBYEKT sifatida uzatiladi: bu holda
 * nom bo'yicha qidiruv umuman bo'lmaydi.
 */
const config = {
  plugins: [
    ["@tailwindcss/postcss", {}],
    fontScale(),
  ],
};

export default config;
