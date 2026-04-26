import { mkdir, writeFile } from "node:fs/promises";

const samples = [
  {
    id: "product-hero",
    title: "Product Hero",
    bg: "#f4dfc2",
    accent: "#c95f45",
    svg: `<rect x="84" y="92" width="792" height="456" rx="36" fill="#f4dfc2"/><rect x="168" y="334" width="482" height="92" rx="22" fill="#d89958" opacity=".56"/><rect x="346" y="155" width="156" height="252" rx="34" fill="#fbfbf8" stroke="#14181c" stroke-width="8"/><rect x="382" y="244" width="84" height="84" rx="12" fill="#f7f1e5" stroke="#14181c" stroke-width="5"/><text x="395" y="294" font-size="18" font-weight="800" fill="#14181c">AZHU</text><circle cx="610" cy="194" r="52" fill="#c95f45" opacity=".35"/><path d="M128 146 C282 68 520 64 766 126" stroke="#fff8ec" stroke-width="28" opacity=".65" fill="none"/>`
  },
  {
    id: "minimal-saas-hero",
    title: "SaaS Hero",
    bg: "#eef0e8",
    accent: "#3b6f68",
    svg: `<rect x="108" y="108" width="744" height="400" rx="34" fill="#fbfbf8" stroke="#111418" stroke-width="8"/><rect x="148" y="154" width="664" height="62" rx="18" fill="#111418"/><rect x="176" y="248" width="182" height="156" rx="22" fill="#e9f0e8" stroke="#3b6f68" stroke-width="5"/><rect x="392" y="248" width="392" height="156" rx="22" fill="#fff8ec" stroke="#d8d0c1" stroke-width="5"/><path d="M430 354 L496 308 L566 330 L638 276 L736 318" stroke="#c95f45" stroke-width="10" fill="none"/><text x="182" y="316" font-size="28" font-weight="800" fill="#111418">Revenue</text><text x="430" y="294" font-size="22" font-weight="700" fill="#111418">Retention</text>`
  },
  {
    id: "character-mascot",
    title: "Mascot",
    bg: "#d9eadf",
    accent: "#3b6f68",
    svg: `<circle cx="248" cy="338" r="112" fill="#fbfbf8" stroke="#111418" stroke-width="8"/><rect x="172" y="166" width="152" height="132" rx="34" fill="#fbfbf8" stroke="#111418" stroke-width="8"/><circle cx="216" cy="232" r="10" fill="#3b6f68"/><circle cx="280" cy="232" r="10" fill="#3b6f68"/><path d="M220 262 Q248 282 276 262" stroke="#c95f45" stroke-width="8" fill="none"/><rect x="476" y="184" width="164" height="140" rx="34" fill="#fbfbf8" stroke="#111418" stroke-width="8"/><rect x="442" y="348" width="232" height="112" rx="30" fill="#fbfbf8" stroke="#111418" stroke-width="8"/><rect x="704" y="210" width="156" height="132" rx="34" fill="#fbfbf8" stroke="#111418" stroke-width="8"/><path d="M704 400 L860 400" stroke="#111418" stroke-width="10"/><circle cx="782" cy="214" r="10" fill="#c95f45"/>`
  },
  {
    id: "editorial-header",
    title: "Editorial",
    bg: "#e9dfcf",
    accent: "#624834",
    svg: `<rect x="0" y="0" width="960" height="640" fill="#e9dfcf"/><rect x="116" y="330" width="728" height="148" rx="18" fill="#9a7b5c"/><rect x="214" y="158" width="260" height="174" rx="18" fill="#111418"/><rect x="234" y="184" width="220" height="124" rx="10" fill="#f7f1e5"/><rect x="540" y="114" width="92" height="118" rx="6" fill="#c95f45"/><rect x="654" y="134" width="120" height="86" rx="6" fill="#3b6f68"/><rect x="572" y="288" width="198" height="118" rx="10" fill="#fbfbf8"/><path d="M118 112 C288 76 478 72 820 126" stroke="#fff8ec" stroke-width="26" opacity=".55" fill="none"/>`
  },
  {
    id: "isometric-workflow",
    title: "Workflow",
    bg: "#f8f8f5",
    accent: "#7f9183",
    svg: `<rect width="960" height="640" fill="#f8f8f5"/><g fill="#fbfbf8" stroke="#111418" stroke-width="6"><path d="M136 280 L224 232 L312 280 L224 328 Z"/><path d="M312 280 L400 232 L488 280 L400 328 Z"/><path d="M488 280 L576 232 L664 280 L576 328 Z"/><path d="M224 430 L312 382 L400 430 L312 478 Z"/><path d="M576 430 L664 382 L752 430 L664 478 Z"/></g><g stroke="#c95f45" stroke-width="8" fill="none"><path d="M312 280 H488"/><path d="M576 328 L664 382"/><path d="M400 382 L488 328"/></g><text x="190" y="286" font-size="22" font-weight="800">Idea</text><text x="352" y="286" font-size="22" font-weight="800">Prompt</text><text x="522" y="286" font-size="22" font-weight="800">Generate</text><text x="266" y="436" font-size="22" font-weight="800">Evaluate</text><text x="620" y="436" font-size="22" font-weight="800">Refine</text>`
  },
  {
    id: "packaging-system",
    title: "Packaging",
    bg: "#e7ddc9",
    accent: "#1f3f36",
    svg: `<rect width="960" height="640" fill="#e7ddc9"/><rect x="126" y="254" width="170" height="232" rx="12" fill="#1f3f36"/><rect x="336" y="206" width="178" height="280" rx="12" fill="#fbfbf8" stroke="#111418" stroke-width="6"/><rect x="566" y="240" width="132" height="246" rx="34" fill="#27332e"/><ellipse cx="632" cy="240" rx="66" ry="22" fill="#c7a45d"/><rect x="728" y="306" width="110" height="180" rx="28" fill="#fbfbf8" stroke="#111418" stroke-width="6"/><text x="158" y="358" font-size="24" font-weight="800" fill="#f7f1e5">NORTH</text><text x="370" y="350" font-size="28" font-weight="800" fill="#111418">WINDOW</text>`
  },
  {
    id: "architectural-concept",
    title: "Architecture",
    bg: "#c9d1cf",
    accent: "#9a6b42",
    svg: `<rect width="960" height="640" fill="#c9d1cf"/><rect x="0" y="420" width="960" height="220" fill="#6f8a8b"/><path d="M214 386 L480 190 L746 386 Z" fill="#fbfbf8" stroke="#111418" stroke-width="8"/><path d="M288 386 L480 250 L672 386 Z" fill="#d8b989" stroke="#111418" stroke-width="6"/><g stroke="#9a6b42" stroke-width="12"><path d="M332 386 V278"/><path d="M410 386 V228"/><path d="M488 386 V226"/><path d="M566 386 V228"/><path d="M644 386 V278"/></g><path d="M168 468 C286 430 390 514 504 468 C616 424 720 510 824 470" stroke="#e9dfcf" stroke-width="14" opacity=".8" fill="none"/>`
  },
  {
    id: "sticker-sheet",
    title: "Stickers",
    bg: "#fbfbf8",
    accent: "#df775d",
    svg: `<rect width="960" height="640" fill="#fbfbf8"/><g fill="#fff8ec" stroke="#111418" stroke-width="7"><rect x="108" y="96" width="152" height="104" rx="22"/><circle cx="386" cy="146" r="58"/><rect x="544" y="90" width="122" height="112" rx="22"/><path d="M760 92 L842 180 L730 190 Z"/><rect x="126" y="282" width="118" height="118" rx="30"/><circle cx="388" cy="340" r="64"/><rect x="520" y="286" width="168" height="108" rx="20"/><path d="M752 292 C842 292 842 402 752 402 C690 402 690 292 752 292 Z"/><rect x="112" y="466" width="174" height="78" rx="38"/><rect x="368" y="456" width="116" height="116" rx="18"/><circle cx="622" cy="514" r="58"/><rect x="734" y="472" width="118" height="78" rx="18"/></g><g fill="#df775d"><circle cx="386" cy="146" r="18"/><rect x="144" y="126" width="82" height="16" rx="8"/><rect x="550" y="332" width="108" height="14" rx="7"/><text x="148" y="518" font-size="24" font-weight="900" fill="#111418">ship it</text></g>`
  }
];

await mkdir("assets/samples", { recursive: true });

for (const sample of samples) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640" role="img" aria-labelledby="title desc">
  <title id="title">${sample.title}</title>
  <desc id="desc">Demo preview artwork for the ${sample.title} GPT Image 2 prompt recipe.</desc>
  <rect width="960" height="640" fill="${sample.bg}"/>
  ${sample.svg}
  <rect x="28" y="28" width="222" height="42" rx="21" fill="#111418" opacity=".9"/>
  <text x="50" y="56" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" fill="#fbfbf8">preview demo</text>
</svg>
`;
  await writeFile(`assets/samples/${sample.id}.svg`, svg, "utf8");
}
