import { IntroReset, IntroSplashOverlay } from "./intro-splash-client";
import { INTRO_ATTR, INTRO_KEY } from "./intro-splash-config";

/**
 * PLATFORMAGA KIRISH ANIMATSIYASI — ekran o'rtasida logo, bir kirishda bir marta.
 *
 * "Bir kirish" = brauzer oynasi sessiyasi (`sessionStorage`): login'dan keyin yoki
 * saytni yangi oynada ochganda o'ynaydi; bo'limdan bo'limga o'tishda va sahifani
 * yangilashda QAYTA chiqmaydi. `/login` ochilganda belgi o'chadi (`IntroReset`),
 * ya'ni qayta kirgan odam animatsiyani yana ko'radi.
 *
 * Skript ataylab shu yerda, server komponentda: u sahifa chizilishidan OLDIN
 * ishlaydi, aks holda kabinet bir lahza ko'rinib, keyin ustiga parda tushardi
 * (yoki aksincha — ko'rgan odamga parda lip etib o'tardi).
 */
export function IntroSplash() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html:
            `try{if(!sessionStorage.getItem("${INTRO_KEY}"))` +
            `document.documentElement.setAttribute("${INTRO_ATTR}","in");}catch(e){}`,
        }}
      />
      <IntroSplashOverlay />
    </>
  );
}

export { IntroReset };
