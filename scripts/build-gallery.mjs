import { mkdir, readFile, writeFile } from "node:fs/promises";

const prompts = JSON.parse(await readFile("catalog/prompts.json", "utf8"));

const cards = prompts.map((item) => `
  <article class="card">
    <div class="visual ${item.category}">
      <span>${escapeHtml(item.category.replaceAll("-", " "))}</span>
    </div>
    <div class="body">
      <p class="eyebrow">${escapeHtml(item.model)} / ${escapeHtml(item.recommended_settings.size)}</p>
      <h2>${escapeHtml(item.title)}</h2>
      <p>${escapeHtml(item.notes)}</p>
      <pre>${escapeHtml(item.prompt)}</pre>
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
    body {
      margin: 0;
      background: #f7f1e5;
    }
    header {
      padding: 56px min(6vw, 72px) 32px;
      background: #111418;
      color: #fbfbf8;
    }
    h1 {
      margin: 0;
      font-size: clamp(40px, 7vw, 84px);
      line-height: 0.95;
      letter-spacing: 0;
      max-width: 980px;
    }
    header p {
      max-width: 720px;
      font-size: 20px;
      line-height: 1.5;
      color: #d7d0c3;
    }
    main {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
      gap: 22px;
      padding: 32px min(6vw, 72px) 72px;
    }
    .card {
      background: #fbfbf8;
      border: 1px solid #d8d0c1;
      border-radius: 8px;
      overflow: hidden;
    }
    .visual {
      min-height: 190px;
      display: grid;
      place-items: center;
      color: #fbfbf8;
      text-transform: uppercase;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.08em;
    }
    .product-photography { background: linear-gradient(135deg, #c95f45, #f0c98d); }
    .ui-brand { background: linear-gradient(135deg, #232a31, #3b6f68); }
    .character-design { background: linear-gradient(135deg, #3b6f68, #c7e4d6); color: #111418; }
    .editorial { background: linear-gradient(135deg, #624834, #b66d52); }
    .diagram { background: linear-gradient(135deg, #1f2933, #7f9183); }
    .brand-design { background: linear-gradient(135deg, #1f3f36, #c7a45d); }
    .architecture { background: linear-gradient(135deg, #3a4650, #d8b989); }
    .illustration { background: linear-gradient(135deg, #1d1d1b, #df775d); }
    .body {
      padding: 22px;
    }
    .eyebrow {
      margin: 0 0 8px;
      text-transform: uppercase;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #65717b;
    }
    h2 {
      margin: 0 0 10px;
      font-size: 24px;
      letter-spacing: 0;
    }
    .body p {
      color: #46515c;
      line-height: 1.5;
    }
    pre {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      background: #111418;
      color: #f7f1e5;
      padding: 16px;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.55;
    }
  </style>
</head>
<body>
  <header>
    <h1>Awesome GPT Image 2 Prompts</h1>
    <p>Structured visual recipes for product shots, UI launch assets, characters, diagrams, editorial images, and brand systems.</p>
  </header>
  <main>
    ${cards}
  </main>
</body>
</html>
`;

await mkdir("site", { recursive: true });
await writeFile("site/index.html", html, "utf8");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

