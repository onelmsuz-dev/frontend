"use client";

import { useId } from "react";
import { BODY_PATH, CAP_PATH, LOGO_VIEWBOX, ONE_PATH, TASSEL_PATH } from "./logo-paths";
import styles from "./animated-logo.module.css";

/** Kirish animatsiyalari — bir marta o'ynaydi va tayyor logoda to'xtaydi. */
export const INTRO_VARIANTS = ["draw", "assemble", "rise", "flip"] as const;
export type LogoAnimation = (typeof INTRO_VARIANTS)[number] | "none";

type Props = {
  variant?: LogoAnimation;
  /** Kenglik va balandlik (px). */
  size?: number;
  className?: string;
  title?: string;
};

export function AnimatedLogo({ variant = "none", size = 160, className, title = "OneRoom" }: Props) {
  // Bir sahifada bir nechta logo bo'lsa gradient/clip id'lari to'qnashmasin.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={LOGO_VIEWBOX}
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      data-anim={variant}
      className={className ? `${styles.logo} ${className}` : styles.logo}
    >
      <defs>
        <linearGradient id={id("cap")} x1="150" y1="90" x2="900" y2="330" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00A6FF" />
          <stop offset="1" stopColor="#0048FF" />
        </linearGradient>
        <linearGradient id={id("body")} x1="230" y1="300" x2="790" y2="960" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0095FF" />
          <stop offset=".55" stopColor="#0552FB" />
          <stop offset="1" stopColor="#1226DC" />
        </linearGradient>
        <linearGradient id={id("fold")} x1="580" y1="640" x2="640" y2="960" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0A1FC4" stopOpacity="0" />
          <stop offset="1" stopColor="#0A14B8" stopOpacity=".75" />
        </linearGradient>
        <linearGradient id={id("tassel")} x1="900" y1="250" x2="990" y2="500" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0046F5" />
          <stop offset="1" stopColor="#0028C2" />
        </linearGradient>
        <linearGradient id={id("shine")} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={id("body-clip")}>
          <path d={BODY_PATH} />
        </clipPath>
        <clipPath id={id("one-clip")}>
          <path d={ONE_PATH} />
        </clipPath>
        <clipPath id={id("logo-clip")}>
          <path d={BODY_PATH} />
          <path d={CAP_PATH} />
          <path d={TASSEL_PATH} clipRule="evenodd" />
        </clipPath>
      </defs>

      <g className={styles.bodyGroup}>
        <g className={styles.bodyBase}>
          <path fill={url("body")} d={BODY_PATH} />
          <path fill={url("fold")} clipPath={url("body-clip")} d="M579 560H860V1000H540Z" />
        </g>
      </g>

      <g className={styles.capGroup}>
        <path className={styles.tassel} fill={url("tassel")} fillRule="evenodd" d={TASSEL_PATH} />
        <path className={styles.cap} fill={url("cap")} d={CAP_PATH} />
      </g>

      {/* "1" — oq to'rtburchak raqam shakli bilan kesiladi, shunda uni pastdan ko'tarish mumkin. */}
      <g className={styles.bodyGroup}>
        <g clipPath={url("one-clip")}>
          <rect className={styles.oneFill} x="270" y="350" width="320" height="660" fill="#fff" />
        </g>
      </g>

      <g className={styles.shineWrap} clipPath={url("logo-clip")}>
        <rect className={styles.shine} x="-300" y="0" width="300" height="1024" fill={url("shine")} />
      </g>

      <g className={styles.strokes} strokeWidth="12" strokeLinejoin="round">
        <path className={styles.strokeBody} stroke={url("body")} pathLength={1} d={BODY_PATH} />
        <path className={styles.strokeOne} stroke={url("body")} pathLength={1} d={ONE_PATH} />
        <path className={styles.strokeCap} stroke={url("cap")} pathLength={1} d={CAP_PATH} />
        <path className={styles.strokeTassel} stroke={url("tassel")} pathLength={1} d={TASSEL_PATH} />
      </g>
    </svg>
  );
}
