import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const prompts = JSON.parse(await readFile("catalog/prompts.json", "utf8"));
const docsDir = "docs";
const categories = Array.from(new Set(prompts.map((item) => item.category)));
const categoryLabels = {
  "product-photography": "Product",
  "ui-brand": "UI / Brand",
  "character-design": "Character",
  editorial: "Editorial",
  diagram: "Diagram",
  "brand-design": "Brand",
  architecture: "Architecture",
  illustration: "Illustration"
};
const categoryLabelsZh = {
  "product-photography": "产品",
  "ui-brand": "UI / 品牌",
  "character-design": "角色",
  editorial: "编辑头图",
  diagram: "图示",
  "brand-design": "品牌",
  architecture: "建筑",
  illustration: "插画"
};

const categoryButtons = categories.map((category) => `
  <button class="chip" data-filter="${escapeHtml(category)}">
    <span data-lang="en">${escapeHtml(categoryLabels[category] ?? category)}</span>
    <span data-lang="zh">${escapeHtml(categoryLabelsZh[category] ?? category)}</span>
  </button>
`).join("\n");

const cards = prompts.map((item) => `
  <article class="card" data-category="${escapeHtml(item.category)}">
    <figure>
      <img src="${escapeHtml(item.preview_image)}" alt="${escapeHtml(item.title)} generated output" loading="lazy">
      <figcaption>
        <span data-lang="en">Generated output</span>
        <span data-lang="zh">实际生成图</span>
      </figcaption>
    </figure>
    <div class="body">
      <p class="eyebrow">
        <span>${escapeHtml(item.model)}</span>
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
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #111418;
      background: #f7f1e5;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      background: #f7f1e5;
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
      padding: 48px min(6vw, 72px) 30px;
      background: #111418;
      color: #fbfbf8;
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
      color: #d8d0c1;
    }
    .language {
      display: inline-flex;
      border: 1px solid #3b454d;
      border-radius: 999px;
      padding: 4px;
      background: #1b2228;
    }
    .language button {
      border: 0;
      border-radius: 999px;
      padding: 8px 14px;
      color: #d8d0c1;
      background: transparent;
      font-weight: 800;
      cursor: pointer;
    }
    body.lang-en .language [data-set-lang="en"],
    body.lang-zh .language [data-set-lang="zh"] {
      color: #111418;
      background: #f7f1e5;
    }
    h1 {
      margin: 0;
      font-size: clamp(38px, 7vw, 86px);
      line-height: 0.96;
      letter-spacing: 0;
      max-width: 1040px;
    }
    header p {
      max-width: 780px;
      font-size: 20px;
      line-height: 1.55;
      color: #d7d0c3;
    }
    .controls {
      padding: 24px min(6vw, 72px) 0;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .chip {
      border: 1px solid #d1c8b7;
      background: #fbfbf8;
      color: #111418;
      border-radius: 999px;
      padding: 10px 14px;
      font-weight: 800;
      cursor: pointer;
    }
    .chip.active {
      background: #111418;
      color: #fbfbf8;
      border-color: #111418;
    }
    main {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
      gap: 22px;
      padding: 24px min(6vw, 72px) 72px;
    }
    .card {
      background: #fbfbf8;
      border: 1px solid #d8d0c1;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .card[hidden] {
      display: none;
    }
    figure {
      margin: 0;
      position: relative;
      background: #e6ddce;
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
      background: rgba(17, 20, 24, .88);
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
      color: #65717b;
    }
    h2 {
      margin: 0;
      font-size: 24px;
      line-height: 1.15;
      letter-spacing: 0;
    }
    .notes {
      margin: 0;
      color: #46515c;
      line-height: 1.5;
    }
    .tags {
      display: flex;
      gap: 7px;
      flex-wrap: wrap;
    }
    .tags span {
      background: #efe7d9;
      border-radius: 999px;
      padding: 5px 8px;
      font-size: 12px;
      font-weight: 800;
      color: #46515c;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      background: #111418;
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
      background: #c95f45;
      color: #fffaf0;
      padding: 10px 14px;
      font-weight: 900;
      cursor: pointer;
    }
    @media (max-width: 720px) {
      .topbar {
        align-items: flex-start;
        flex-direction: column;
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
      <span data-lang="en">Awesome GPT Image 2 Prompts</span>
      <span data-lang="zh">Awesome GPT Image 2 Prompts</span>
    </h1>
    <p>
      <span data-lang="en">Structured visual recipes for product shots, UI launch assets, characters, diagrams, editorial images, and brand systems.</span>
      <span data-lang="zh">面向产品图、UI 发布图、角色、图示、编辑头图和品牌系统的结构化视觉提示词。</span>
    </p>
  </header>
  <section class="controls" aria-label="Category filters">
    <button class="chip active" data-filter="all">
      <span data-lang="en">All</span>
      <span data-lang="zh">全部</span>
    </button>
    ${categoryButtons}
  </section>
  <main>
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
