import { Fragment, type ReactNode } from "react";

/**
 * CHAT UCHUN KICHIK MARKDOWN — faqat yordamchi yozadigan qism:
 * paragraf, qator uzilishi, **qalin**, *kursiv*, `kod`, raqamli va
 * nuqtali ro'yxat (ichma-ich ham). HTML HECH QACHON chizilmaydi —
 * hammasi React tugunlari, ya'ni model matnida teg bo'lsa ham u matn
 * bo'lib ko'rinadi.
 */

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\n]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={`${keyBase}-t${i++}`}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(<strong key={`${keyBase}-b${i++}`} className="font-semibold text-neutral-900 dark:text-white">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      out.push(<code key={`${keyBase}-c${i++}`} className="rounded bg-neutral-100 dark:bg-white/10 px-1 py-0.5 text-[12px]">{tok.slice(1, -1)}</code>);
    } else {
      out.push(<em key={`${keyBase}-i${i++}`}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(<Fragment key={`${keyBase}-t${i++}`}>{text.slice(last)}</Fragment>);
  return out;
}

type Item = { indent: number; ordered: boolean; num: number; text: string };

function renderList(items: Item[], keyBase: string): ReactNode {
  // Birinchi element darajasidagi ro'yxat; chuqurroqlari oxirgi elementning ichiga.
  const base = items[0].indent;
  const groups: { item: Item; children: Item[] }[] = [];
  for (const it of items) {
    if (it.indent > base && groups.length) groups[groups.length - 1].children.push(it);
    else groups.push({ item: it, children: [] });
  }
  const ordered = groups[0].item.ordered;
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag key={keyBase} start={ordered ? groups[0].item.num : undefined}
      className={ordered ? "list-decimal pl-5 space-y-1 marker:text-indigo-500 marker:font-semibold"
                         : "list-disc pl-5 space-y-1 marker:text-indigo-400"}>
      {groups.map((g, i) => (
        <li key={`${keyBase}-${i}`} className="pl-0.5">
          {inline(g.item.text, `${keyBase}-${i}`)}
          {g.children.length > 0 && <div className="mt-1">{renderList(g.children, `${keyBase}-${i}-s`)}</div>}
        </li>
      ))}
    </Tag>
  );
}

export function ChatMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: Item[] = [];
  const flushPara = () => {
    if (!para.length) return;
    const k = `p${blocks.length}`;
    blocks.push(
      <p key={k}>
        {para.map((l, i) => (
          <Fragment key={`${k}-${i}`}>{i > 0 && <br />}{inline(l, `${k}-${i}`)}</Fragment>
        ))}
      </p>,
    );
    para = [];
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push(renderList(list, `l${blocks.length}`));
    list = [];
  };
  for (const raw of lines) {
    const li = raw.match(/^(\s*)(?:(\d+)[.)]|[-*•])\s+(.*)$/);
    if (li) {
      flushPara();
      list.push({ indent: li[1].length, ordered: !!li[2], num: Number(li[2] ?? 1), text: li[3] });
      continue;
    }
    if (!raw.trim()) { flushPara(); flushList(); continue; }
    if (list.length && /^\s{2,}\S/.test(raw)) { list[list.length - 1].text += " " + raw.trim(); continue; }
    flushList();
    para.push(raw.replace(/^#{1,6}\s+/, ""));
  }
  flushPara();
  flushList();
  return <div className="space-y-2.5">{blocks}</div>;
}
