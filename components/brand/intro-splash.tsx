import { IntroReset, IntroSplashOverlay } from "./intro-splash-client";

/**
 * PLATFORMAGA KIRISH ANIMATSIYASI — ekran o'rtasida logo, bir kirishda bir marta.
 *
 * "Bir kirish" = brauzer oynasi sessiyasi (`sessionStorage`): login'dan keyin yoki
 * saytni yangi oynada ochganda o'ynaydi; bo'limdan bo'limga o'tishda va sahifani
 * yangilashda QAYTA chiqmaydi. `/login` ochilganda belgi o'chadi (`IntroReset`),
 * ya'ni qayta kirgan odam animatsiyani yana ko'radi.
 *
 * PARDA SUKUT BO'YICHA KO'RINADI — server HTML'ining o'zida, kabinetdan OLDIN.
 * Ilgari teskari edi (yashirin, skript yoqardi) va prodda kabinet bir lahza
 * ko'rinib, keyin ustiga parda tushardi. Endi birinchi kirishda ekranga chiqadigan
 * BIRINCHI narsa — parda; skript faqat animatsiyani ko'rgan odamda uni yashiradi
 * va pardadan keyin darhol turadi, ya'ni kabinet chizilishidan oldin ishlaydi.
 */
/**
 * Skript matni ATAYLAB bitta oddiy satr — `${...}` qo'yilmasiz.
 *
 * Avval u shablon satr edi (`"${INTRO_KEY}"))` + ...) va production build'da
 * qo'yilmadan keyingi belgilar tushib qolib, skript sintaksis xatosi bilan
 * o'lardi (dev'da ishlardi). Natijada parda kech, hidratsiyadan keyin chiqardi.
 * Kalit va id `intro-splash-config.ts` dagi `INTRO_KEY` / `INTRO_ID` bilan BIR XIL
 * bo'lishi shart.
 */
const HIDE_IF_SEEN =
  '(function(){var e=document.getElementById("oneroom-intro"),s=1;' +
  'try{s=sessionStorage.getItem("oneroom-intro")}catch(x){}' +
  'if(e&&s)e.style.display="none"})()';

export function IntroSplash() {
  return (
    <>
      <IntroSplashOverlay />
      <script dangerouslySetInnerHTML={{ __html: HIDE_IF_SEEN }} />
    </>
  );
}

export { IntroReset };
