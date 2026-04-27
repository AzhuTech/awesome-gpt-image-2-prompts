import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const prompts = JSON.parse(await readFile("catalog/prompts.json", "utf8"));
const docsDir = "docs";
const categories = Array.from(new Set(prompts.map((item) => item.category)));
const categoryLabels = {
  "game-art": "Game Art",
  "anime-character": "Anime Character",
  "cinematic-film": "Cinematic Film",
  "beauty-photography": "Beauty Photo",
  "brand-commercial": "Commercial",
  "utility-design": "Utility Design"
};
const categoryLabelsZh = {
  "game-art": "游戏艺术",
  "anime-character": "二次元角色",
  "cinematic-film": "影视电影感",
  "beauty-photography": "人像大片",
  "brand-commercial": "商业品牌",
  "utility-design": "实用设计"
};

const featured = prompts.slice(0, 4);
const heroImage = featured[0];

const categoryButtons = categories.map((category) => `
  <button class="chip" data-filter="${escapeHtml(category)}">
    <span data-lang="en">${escapeHtml(categoryLabels[category] ?? category)}</span>
    <span data-lang="zh">${escapeHtml(categoryLabelsZh[category] ?? category)}</span>
  </button>
`).join("\n");

const heroTiles = featured.map((item, index) => `
  <article class="hero-tile ${index === 0 ? "hero-tile-large" : ""}">
    <img src="${escapeHtml(item.preview_image)}" alt="${escapeHtml(item.title)} generated output">
    <div>
      <p>
        <span data-lang="en">${escapeHtml(categoryLabels[item.category] ?? item.category)}</span>
        <span data-lang="zh">${escapeHtml(categoryLabelsZh[item.category] ?? item.category)}</span>
        / ${escapeHtml(item.model)}
      </p>
      <h2>
        <span data-lang="en">${escapeHtml(item.title)}</span>
        <span data-lang="zh">${escapeHtml(item.title_zh)}</span>
      </h2>
    </div>
  </article>
`).join("\n");

const cards = prompts.map((item) => `
  <article class="card" data-category="${escapeHtml(item.category)}">
    <figure>
      <img src="${escapeHtml(item.preview_image)}" alt="${escapeHtml(item.title)} generated output">
      <figcaption>
        <span data-lang="en">Generated output</span>
        <span data-lang="zh">实际生成图</span>
      </figcaption>
    </figure>
    <div class="body">
      <p class="eyebrow">
        <span>
          <span data-lang="en">${escapeHtml(categoryLabels[item.category] ?? item.category)}</span>
          <span data-lang="zh">${escapeHtml(categoryLabelsZh[item.category] ?? item.category)}</span>
        </span>
        <span>${escapeHtml(item.recommended_settings.size)}</span>
      </p>
      <h2>
        <span data-lang="en">${escapeHtml(item.title)}</span>
        <span data-lang="zh">${escapeHtml(item.title_zh)}</span>
      </h2>
      <p class="notes">
        <span data-lang="en">${escapeHtml(item.notes)}</span>
        <span data-lang="zh">${escapeHtml(item.notes_zh)}</span>
      </p>
      <div class="tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      <pre data-prompt-en="${escapeAttribute(item.prompt)}" data-prompt-zh="${escapeAttribute(item.prompt_zh)}">${escapeHtml(item.prompt)}</pre>
      <button class="copy" type="button">
        <span data-lang="en">Copy prompt</span>
        <span data-lang="zh">复制提示词</span>
      </button>
    </div>
  </article>
`).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Awesome GPT Image 2 Prompts</title>
  <style>
    :root {
      color-scheme: dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #f8fafc;
      background: #090a0f;
      --content-max: 1760px;
      --page-pad: max(44px, calc((100vw - var(--content-max)) / 2));
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      background: #090a0f;
    }
    [data-lang="zh"] {
      display: none;
    }
    body.lang-zh [data-lang="en"] {
      display: none;
    }
    body.lang-zh [data-lang="zh"] {
      display: inline;
    }
    header {
      min-height: clamp(720px, 92vh, 980px);
      padding: 48px var(--page-pad) 42px;
      color: #fbfbf8;
      background:
        linear-gradient(90deg, rgba(9, 10, 15, .98), rgba(9, 10, 15, .72) 38%, rgba(9, 10, 15, .18)),
        linear-gradient(0deg, #090a0f, rgba(9, 10, 15, .16) 44%, rgba(9, 10, 15, .52)),
        url("${escapeHtml(heroImage.preview_image)}") center / cover;
    }
    .hero-shell {
      width: min(100%, var(--content-max));
      min-height: calc(clamp(720px, 92vh, 980px) - 90px);
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: clamp(38px, 5vh, 74px);
    }
    .brand {
      text-transform: uppercase;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: .12em;
      color: #dbe4ef;
    }
    .language {
      display: inline-flex;
      border: 1px solid rgba(248, 250, 252, .28);
      border-radius: 999px;
      padding: 4px;
      background: rgba(12, 16, 26, .78);
      backdrop-filter: blur(14px);
    }
    .language button {
      border: 0;
      border-radius: 999px;
      padding: 8px 14px;
      color: #dbe4ef;
      background: transparent;
      font-weight: 800;
      cursor: pointer;
    }
    body.lang-en .language [data-set-lang="en"],
    body.lang-zh .language [data-set-lang="zh"] {
      color: #111418;
      background: #f8fafc;
    }
    .hero-content {
      flex: 1;
      display: grid;
      grid-template-columns: minmax(430px, .72fr) minmax(760px, 1.28fr);
      gap: clamp(34px, 5vw, 92px);
      align-items: center;
    }
    .hero-copy {
      max-width: 760px;
      padding-bottom: 28px;
    }
    h1 {
      margin: 0;
      font-size: clamp(52px, 4.4vw, 96px);
      line-height: 1;
      letter-spacing: 0;
      text-shadow: 0 3px 40px rgba(0, 0, 0, .45);
    }
    .hero-copy p {
      margin: 26px 0 0;
      max-width: 680px;
      font-size: clamp(18px, 1.05vw, 22px);
      line-height: 1.55;
      color: #dbe4ef;
    }
    .hero-gallery {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      grid-template-rows: repeat(2, minmax(220px, 1fr));
      gap: 16px;
      min-width: 0;
    }
    .hero-tile {
      position: relative;
      min-height: 250px;
      overflow: hidden;
      border: 1px solid rgba(248, 250, 252, .2);
      border-radius: 8px;
      background: #151924;
      box-shadow: 0 22px 70px rgba(0, 0, 0, .34);
    }
    .hero-tile-large {
      grid-column: span 2;
      grid-row: span 2;
      min-height: 540px;
    }
    .hero-tile img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }
    .hero-tile::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, transparent 30%, rgba(5, 7, 12, .92));
    }
    .hero-tile div {
      position: absolute;
      left: 16px;
      right: 16px;
      bottom: 16px;
      z-index: 1;
    }
    .hero-tile p {
      margin: 0 0 8px;
      color: #fbbf24;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .08em;
    }
    .hero-tile h2 {
      margin: 0;
      color: #fff;
      font-size: clamp(20px, 1.35vw, 30px);
      line-height: 1.12;
      letter-spacing: 0;
      text-shadow: 0 1px 20px rgba(0, 0, 0, .5);
    }
    .hero-tile:not(.hero-tile-large) h2 {
      font-size: clamp(18px, 1.05vw, 22px);
    }
    .controls {
      position: sticky;
      top: 0;
      z-index: 5;
      padding: 16px var(--page-pad);
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      background: rgba(9, 10, 15, .9);
      border-top: 1px solid rgba(248, 250, 252, .12);
      border-bottom: 1px solid rgba(248, 250, 252, .1);
      backdrop-filter: blur(18px);
    }
    .chip {
      border: 1px solid rgba(248, 250, 252, .18);
      background: rgba(248, 250, 252, .08);
      color: #f8fafc;
      border-radius: 999px;
      padding: 10px 14px;
      font-weight: 800;
      cursor: pointer;
    }
    .chip.active {
      background: #fbbf24;
      color: #111418;
      border-color: #fbbf24;
    }
    main {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
      gap: 24px;
      width: min(100%, var(--content-max));
      margin: 0 auto;
      padding: 34px 0 80px;
      background: #090a0f;
    }
    .card {
      background: #111827;
      border: 1px solid rgba(248, 250, 252, .12);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-width: 0;
      box-shadow: 0 18px 50px rgba(0, 0, 0, .22);
    }
    .card[hidden] {
      display: none;
    }
    figure {
      margin: 0;
      position: relative;
      background: #1f2937;
      aspect-ratio: 3 / 2;
      overflow: hidden;
    }
    figure img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }
    figcaption {
      position: absolute;
      left: 14px;
      bottom: 14px;
      border-radius: 999px;
      background: rgba(5, 7, 12, .86);
      color: #fbfbf8;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 800;
    }
    .body {
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .eyebrow {
      margin: 0;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      text-transform: uppercase;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .08em;
      color: #94a3b8;
    }
    h2 {
      margin: 0;
      font-size: 24px;
      line-height: 1.15;
      letter-spacing: 0;
      color: #f8fafc;
    }
    .notes {
      margin: 0;
      color: #aab6c7;
      line-height: 1.5;
    }
    .tags {
      display: flex;
      gap: 7px;
      flex-wrap: wrap;
    }
    .tags span {
      background: rgba(248, 250, 252, .1);
      border-radius: 999px;
      padding: 5px 8px;
      font-size: 12px;
      font-weight: 800;
      color: #dbe4ef;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      background: #05070c;
      color: #f7f1e5;
      padding: 16px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.55;
      max-height: 310px;
      overflow: auto;
    }
    .copy {
      align-self: flex-start;
      border: 0;
      border-radius: 999px;
      background: #e11d48;
      color: #fff;
      padding: 10px 14px;
      font-weight: 900;
      cursor: pointer;
    }
    @media (max-width: 980px) {
      :root {
        --page-pad: 28px;
      }
      header {
        min-height: auto;
      }
      .hero-shell {
        min-height: 0;
      }
      .hero-content {
        display: block;
      }
      .hero-copy {
        max-width: 860px;
        padding-bottom: 0;
      }
      .hero-copy p {
        max-width: 760px;
      }
      .hero-gallery {
        margin-top: 34px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: auto;
      }
      .hero-tile-large,
      .hero-tile {
        grid-column: auto;
        grid-row: auto;
        min-height: 260px;
      }
      main {
        width: auto;
        margin: 0;
        padding: 30px var(--page-pad) 72px;
      }
    }
    @media (max-width: 720px) {
      :root {
        --page-pad: 20px;
      }
      header {
        min-height: auto;
      }
      h1 {
        font-size: clamp(40px, 13vw, 62px);
      }
      .topbar {
        align-items: flex-start;
        flex-direction: column;
      }
      .hero-gallery {
        grid-template-columns: 1fr;
      }
      main {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body class="lang-en">
  <header>
    <div class="hero-shell">
      <div class="topbar">
        <div class="brand">AzhuTech / prompt gallery</div>
        <div class="language" aria-label="Language">
          <button type="button" data-set-lang="en">English</button>
          <button type="button" data-set-lang="zh">中文</button>
        </div>
      </div>
      <div class="hero-content">
        <div class="hero-copy">
          <h1>
            <span data-lang="en">Viral GPT Image 2 Prompts</span>
            <span data-lang="zh">GPT Image 2 视觉灵感库</span>
          </h1>
          <p>
            <span data-lang="en">Copy-ready recipes for game art, cinematic film frames, anime character cards, beauty editorials, and commercial visuals.</span>
            <span data-lang="zh">收录游戏关键图、电影感画面、角色立绘、人像大片与商业视觉，配好真实生成图和可复用画面配方。</span>
          </p>
        </div>
        <div class="hero-gallery">
${heroTiles}
        </div>
      </div>
    </div>
  </header>
  <section class="controls" aria-label="Category filters">
    <button class="chip active" data-filter="all">
      <span data-lang="en">All</span>
      <span data-lang="zh">全部</span>
    </button>
    ${categoryButtons}
  </section>
  <main id="gallery">
${cards}
  </main>
  <script>
    const body = document.body;
    const promptBlocks = Array.from(document.querySelectorAll("pre[data-prompt-en]"));

    function setLanguage(lang) {
      body.classList.toggle("lang-en", lang === "en");
      body.classList.toggle("lang-zh", lang === "zh");
      document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
      promptBlocks.forEach((block) => {
        block.textContent = block.dataset[lang === "zh" ? "promptZh" : "promptEn"];
      });
    }

    document.querySelectorAll("[data-set-lang]").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.setLang));
    });

    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
        document.querySelectorAll(".card").forEach((card) => {
          card.hidden = filter !== "all" && card.dataset.category !== filter;
        });
      });
    });

    document.querySelectorAll(".copy").forEach((button) => {
      button.addEventListener("click", async () => {
        const prompt = button.closest(".card").querySelector("pre").textContent;
        await navigator.clipboard.writeText(prompt);
        const previous = button.textContent;
        button.textContent = body.classList.contains("lang-zh") ? "已复制" : "Copied";
        setTimeout(() => { button.textContent = previous; }, 1200);
      });
    });
  </script>
</body>
</html>
`;

await syncDocsAssets(prompts);
await mkdir(docsDir, { recursive: true });
await writeFile(path.join(docsDir, "index.html"), html, "utf8");

async function syncDocsAssets(items) {
  for (const item of items) {
    if (!item.preview_image?.startsWith("assets/")) {
      continue;
    }
    const targetPath = path.join(docsDir, item.preview_image);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await copyFile(item.preview_image, targetPath);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("\n", "&#10;");
}
