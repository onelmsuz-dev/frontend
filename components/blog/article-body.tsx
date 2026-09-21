import Link from "next/link";
import { Fragment } from "react";
import { SITE_URL } from "@/lib/seo/site";

// Trusted editorial content only. Render text as React nodes, never raw HTML.
function inline(text: string) {
  return text.split(/(\[[^\]]+\]\(https:\/\/[^)]+\))/g).map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\((https:\/\/[^)]+)\)$/);
    if (!match) return <Fragment key={index}>{part}</Fragment>;
    const url = new URL(match[2]);
    const internal = url.origin === SITE_URL;
    return <Link key={index} href={internal ? `${url.pathname}${url.search}${url.hash}` : match[2]}>{match[1]}</Link>;
  });
}

export function ArticleBody({ markdown }: { markdown: string }) {
  let heading = 0;
  return markdown.trim().split(/\n\n+/).filter((block) => !block.startsWith("# ")).map((block, index) => {
    if (block.startsWith("## ")) {
      heading++;
      return <h2 key={index} id={`bolim-${heading}`}>{block.slice(3)}</h2>;
    }
    if (block.startsWith("|")) {
      const rows = block.split("\n").map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
      return <div key={index} className="blog-table-scroll" role="region" aria-label="Demo uchun tekshiruv jadvali" tabIndex={0}>
        <table><thead><tr>{rows[0].map((cell, i) => <th key={i} scope="col">{cell}</th>)}</tr></thead>
          <tbody>{rows.slice(2).map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{inline(cell)}</td>)}</tr>)}</tbody>
        </table>
      </div>;
    }
    return <p key={index}>{inline(block)}</p>;
  });
}
