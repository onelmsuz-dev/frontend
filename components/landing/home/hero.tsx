"use client";

import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { ApplyButton } from "@/components/landing/apply-dialog";
import { hero } from "./content";
import s from "./hero.module.css";

/**
 * BOSH SAHIFA HERO'SI ("Perspective": ko'k 3D portal).
 *
 * Dizayn `/testgpt` sahifasidan ko'chirilgan. Uslublar `hero.module.css` da (shu komponentga
 * cheklangan). "Ariza qoldirish" — umumiy ariza modalini (`ApplyProvider`) ochadi;
 * "Imkoniyatlar" — sahifadagi #features bo'limiga silliq o'tkazadi.
 *
 * SEO: H1 brend shiori (kalit so'zsiz); asosiy kalit so'z iborasi H1 ostidagi matnning
 * birinchi jumlasida (`hero.leadStrong`) va rasmning `alt` matnida (`hero.imageAlt`).
 */

/** #features ga o'tish. Harakatni kamaytirish yoqilgan bo'lsa oddiy (sakrab) o'tadi. */
function goToFeatures(e: React.MouseEvent<HTMLAnchorElement>) {
  const target = document.getElementById("features");
  if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", "#features");
}

export function Hero() {
  return (
    <div className={s.hero}>
      <section id="hero" className={`${s.editorial} ${s.editorialWithArt} scroll-mt-24`} aria-labelledby="hero-heading">
        <div className={s.perspectiveGrid}>
          <div className={s.perspectiveCopy}>
            <h1 id="hero-heading" className={s.headline}>
              <span className={s.headlineRow}>{hero.titleLine1}</span>{" "}
              <span className={s.headlineRow}>{hero.titleLine2} <em>{hero.titleAccent}</em></span>
            </h1>

            <div className={s.editorialCopy}>
              <span className={s.shortLine} />
              <p><strong>{hero.leadStrong}</strong> {hero.lead}</p>
              <div className={s.actions}>
                <a href="#features" className={s.secondary} onClick={goToFeatures}>
                  <ArrowDown size={14} aria-hidden /> Imkoniyatlar
                </a>
                <ApplyButton where="Hero" className={s.primary}>Ariza qoldirish <ArrowUpRight size={18} /></ApplyButton>
              </div>
            </div>
          </div>

          <figure className={s.perspectiveArt}>
            <Image
              src="/home/hero-portal.webp"
              alt={hero.imageAlt}
              width={1254}
              height={1254}
              sizes="(max-width: 700px) 92vw, 580px"
              priority
              className={s.perspectiveImage}
            />
          </figure>
        </div>
      </section>
    </div>
  );
}
