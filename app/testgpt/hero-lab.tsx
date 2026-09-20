"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Check, X, Users, Wallet, CalendarDays, LayoutDashboard, ChevronDown, Play, Menu, BarChart3 } from "lucide-react";
import { ApplyProvider, ApplyButton } from "@/components/landing/apply-dialog";
import s from "./hero.module.css";
function Brand() { return <Link href="/" className={s.brand}><Image src="/logo.png" alt="" width={34} height={34}/><span>One<span>Room</span></span></Link>; }
function Product() {
  const [tab,setTab] = useState(0);
  return <div className={s.product}>
    <div className={s.windowBar}><div><i/><i/><i/></div><span>OneRoom / Asosiy filial</span><span className={s.demoLabel}>DEMO</span></div>
    <div className={s.productBody}><aside><Image src="/logo.png" alt="OneRoom" width={27} height={27}/>{[LayoutDashboard,Users,Wallet,CalendarDays].map((Icon,i)=><button key={i} onClick={()=>setTab(i)} aria-label={["Umumiy ko‘rinish","O‘quvchilar","Moliya","Jadval"][i]} aria-pressed={tab===i}><Icon size={18}/></button>)}</aside><div className={s.productContent}><div className={s.productTitle}><div><small>MARKAZINGIZ BUGUN</small><h3>{["Hammasi nazoratda.","Har o‘quvchi e’tiborda.","Hisob-kitob aniq.","Har dars o‘z vaqtida."][tab]}</h3></div><span><span className={s.dot}/> Asosiy filial</span></div>
    {tab === 1 ? <div className={s.studentRows}>{["Malika Ahmedova","Javohir Sobirov","Aziza Ergasheva"].map((n,i)=><div key={n}><span>{n[0]}</span><strong>{n}<small>{i===1 ? "Matematika" : "IELTS Intensive"}</small></strong><b>Faol</b></div>)}</div> : tab === 3 ? <div className={s.lessons}>{["09:00","11:00","14:00"].map((t,i)=><div key={t}><time>{t}</time><span><strong>{["General English","Matematika","IELTS Intensive"][i]}</strong><small>{i+1}-xona · 90 daqiqa</small></span><CalendarDays size={19}/></div>)}</div> : <><div className={s.stats}><div><Users size={16}/><small>Faol o‘quvchilar</small><strong>248</strong></div><div><Wallet size={16}/><small>Oylik tushum</small><strong>32.4 <em>mln</em></strong></div><div><CalendarDays size={16}/><small>Davomat</small><strong>94<em>%</em></strong></div></div><div className={s.chartTitle}><strong>{tab===2 ? "Tushum dinamikasi" : "Markaz faolligi"}</strong><span>Sentabr <ChevronDown size={11}/></span></div><div className={s.chart}>{[28,43,38,61,49,67,62,83,72,90,79,100].map((h,i)=><div key={i} style={{height:h+"%"}}/>)}</div><div className={s.chartLabels}><span>01 sen</span><span>10 sen</span><span>20 sen</span><span>30 sen</span></div></>}
    <div className={s.productFoot}><span className={s.dot}/> Namunaviy ma’lumotlar <span>OneRoom CRM + LMS</span></div></div></div></div>;
}
function Actions({ onDemo }: { onDemo:()=>void }) { return <div className={s.actions}><ApplyButton where="Test hero" className={s.primary}>Demo olish <ArrowUpRight size={18}/></ApplyButton><button className={s.secondary} onClick={onDemo}><Play size={13}/> Tizimni ko‘rish</button></div>; }
function Notes() { return <div className={s.notes}><span><Check size={13}/> O‘rnatish shart emas</span><span><Check size={13}/> O‘zbek tilida</span></div>; }
export default function HeroLab() {
  const [menu,setMenu]=useState(false); const modal=useRef<HTMLDialogElement>(null);
  const openDemo=()=>modal.current?.showModal();
  return <ApplyProvider page="TestGPT hero"><div className={s.page}>
    <header className={s.header}><Brand/><nav className={menu?s.open:""} aria-label="Asosiy menyu"><Link href="/#features">Imkoniyatlar</Link><Link href="/#how-it-works">Qanday ishlaydi</Link><Link href="/#pricing">Narxlar</Link></nav><div className={s.headerActions}><Link href="/login">Kirish <ArrowUpRight size={14}/></Link><ApplyButton where="Test header" className={s.headerCta}>Bog‘lanish <ArrowRight size={15}/></ApplyButton><button className={s.menu} aria-label={menu?"Menyuni yopish":"Menyuni ochish"} aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></div></header>
    <main id="main-content" className={s.entrance}>
    <section className={`${s.editorial} ${s.editorialWithArt}`}>
      <div className={s.editorialTop}><span className={s.eyebrow}><span className={s.dot}/> BIR MARKAZ. BIR BUTUN TIZIM.</span><span className={s.edition}>ONE PLATFORM / EVERY POSSIBILITY</span></div>
      <div className={s.perspectiveGrid}>
        <div className={s.perspectiveCopy}>
          <h1 className={s.headline}><span className={s.headlineRow}>Kamroq ish.</span><span className={s.headlineRow}>Ko‘proq <em>ta’lim.</em></span></h1>
          <div className={s.editorialCopy}><span className={s.shortLine}/><p>Siz ta’lim sifatiga e’tibor qarating. Lidlar, to‘lovlar, davomat va filiallarni OneRoom’da bir joydan boshqaring.</p><Actions onDemo={openDemo}/><Notes/></div>
        </div>
        <figure className={s.perspectiveArt}>
          <Image src="/testgpt/portal.png" alt="Ta’limga yangi imkoniyatlar ochuvchi ko‘k shisha portal" width={1254} height={1254} sizes="(max-width: 700px) 92vw, 580px" priority className={s.perspectiveImage}/>
          <figcaption><span className={s.dot}/><span>Alohida jarayonlar. <strong>Yagona tizim.</strong></span><ArrowUpRight size={18}/></figcaption>
        </figure>
      </div>
    </section>
    <div className={s.bottomLine}><span className={s.bottomLabel}>BARCHASI BIR JOYDA</span><span><Users/> CRM va o‘quvchilar</span><span><Wallet/> Moliya</span><span><CalendarDays/> Jadval va davomat</span><span><BarChart3/> Hisobotlar</span></div>
    </main>
    <dialog ref={modal} className={s.dialog} onClick={e=>{if(e.target===e.currentTarget)modal.current?.close();}}><div className={s.dialogHeader}><div><strong>OneRoom bilan tanishing</strong><p>Yon menyudan bo‘limni tanlang. Ma’lumotlar namunaviy.</p></div><button onClick={()=>modal.current?.close()} aria-label="Namoyishni yopish"><X/></button></div><Product/><div className={s.dialogFooter}><ApplyButton where="Test product demo" className={s.primary} onClick={()=>modal.current?.close()}>Markazim uchun demo <ArrowUpRight size={17}/></ApplyButton></div></dialog>
    </div></ApplyProvider>;
}
