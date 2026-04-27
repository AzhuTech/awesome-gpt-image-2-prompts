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
  "beauty-photography": "美女摄影",
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
      min-height: 92vh;
      padding: 48px min(6vw, 72px) 34px;
      color: #fbfbf8;
      background:
        linear-gradient(90deg, rgba(9, 10, 15, .98), rgba(9, 10, 15, .72) 46%, rgba(9, 10, 15, .25)),
        linear-gradient(0deg, #090a0f, rgba(9, 10, 15, .08) 40%),
        url("${escapeHtml(heroImage.preview_image)}") center / cover;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 42px;
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
    h1 {
      margin: 0;
      font-size: clamp(38px, 7vw, 88px);
      line-height: 0.96;
      letter-spacing: 0;
      max-width: 1040px;
      text-shadow: 0 3px 40px rgba(0, 0, 0, .45);
    }
    header > p {
      max-width: 820px;
      font-size: 20px;
      line-height: 1.55;
      color: #dbe4ef;
    }
    .hero-gallery {
      margin-top: 38px;
      display: grid;
      grid-template-columns: minmax(280px, 1.35fr) repeat(3, minmax(160px, .75fr));
      gap: 14px;
      max-width: 1180px;
    }
    .hero-tile {
      position: relative;
      min-height: 220px;
      overflow: hidden;
      border: 1px solid rgba(248, 250, 252, .2);
      border-radius: 8px;
      background: #151924;
    }
    .hero-tile-large {
      min-height: 340px;
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
      font-size: 22px;
      line-height: 1.12;
      letter-spacing: 0;
      text-shadow: 0 1px 20px rgba(0, 0, 0, .5);
    }
    .controls {
      position: sticky;
      top: 0;
      z-index: 5;
      padding: 16px min(6vw, 72px);
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
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 22px;
      padding: 30px min(6vw, 72px) 72px;
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
    @media (max-width: 720px) {
      header {
        min-height: auto;
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
    <div class="topbar">
      <div class="brand">AzhuTech / prompt gallery</div>
      <div class="language" aria-label="Language">
        <button type="button" data-set-lang="en">English</button>
        <button type="button" data-set-lang="zh">中文</button>
      </div>
    </div>
    <h1>
      <span data-lang="en">Viral GPT Image 2 Prompts</span>
      <span data-lang="zh">高传播 GPT Image 2 提示词</span>
    </h1>
    <p>
      <span data-lang="en">Copy-ready recipes for game art, cinematic film frames, anime character cards, beauty editorials, and commercial visuals.</span>
      <span data-lang="zh">面向游戏艺术、影视剧照、二次元角色、美女摄影和商业视觉的可复制提示词与真实生成图。</span>
    </p>
    <div class="hero-gallery">
${heroTiles}
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
