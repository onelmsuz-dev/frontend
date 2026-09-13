
const OYLAR = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];
const pul = (v) => `${new Intl.NumberFormat("uz-UZ").format(Math.round(v))} so'm`;
function oyNomi(m){ if(!m) return "Davrsiz to'lov"; const [y,mm]=m.split("-").map(Number); return `${OYLAR[mm-1] ?? m} ${y}`; }
function sana(v){ const d=new Date(v); return Number.isNaN(d.getTime())?v:d.toLocaleDateString("uz-UZ"); }
const USUL = { NAQD:"Naqd", KARTA:"Karta", BANK:"Bank o'tkazmasi", CLICK:"Click", PAYME:"Payme" };
export function maydonlar(d) {
  const r = [];
  if (d.student?.name)  r.push(["O'quvchi", d.student.name]);
  if (d.student?.phone) r.push(["Telefon", d.student.phone]);
  if (d.courseName)     r.push(["Kurs", d.courseName]);
  if (d.groupName)      r.push(["Guruh", d.groupName]);
  if (d.coursePrice)    r.push(["Kurs narxi", pul(d.coursePrice)]);
  r.push(["Sana", sana(d.date)]);
  r.push(["To'lov usuli", USUL[d.method] ?? d.method]);
  if (d.receivedBy)     r.push(["Qabul qildi", d.receivedBy]);
  return r;
}

export function davrRoyxati(d) {
  const r = (d.periods ?? []).map(
    (p) => [oyNomi(p.month), pul(p.amount)] );
  if ((d.advance ?? 0) > 0) r.push(["Oldindan to'lov", pul(d.advance!)]);
  if (r.length === 0) r.push(["Oldindan to'lov", pul(d.amount)]);
  return r;
}

