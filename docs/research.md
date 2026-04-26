# Image Prompt Repository Research

Observed on 2026-04-26.

## Official GPT Image 2 Baseline

OpenAI's model page lists `gpt-image-2` as the default GPT Image 2 model and describes it as a state-of-the-art image generation model for fast, high-quality generation and editing. The page lists text and image as inputs, image as output, and image generation / image edit endpoints. It also lists the snapshot `gpt-image-2-2026-04-21`.

Official sources:

- https://platform.openai.com/docs/models/gpt-image-2
- https://platform.openai.com/docs/guides/image-generation

## What Strong Prompt Repos Do Well

### 1. They are not only README lists

The strongest prompt repositories are effectively prompt products:

- web app,
- prompt CSV and Markdown exports,
- self-hosting docs,
- contribution process,
- governance,
- plugin/agent config files.

This is why it can grow far beyond a normal prompt list.

### 2. Visual prompt repos need visible outputs

Image prompt repos with better positioning usually include image examples, categories, and copy-ready JSON-style prompts. A plain text-only image prompt list is weak.

### 3. Single huge README files help SEO but hurt browsing

Several visual prompt collections use a huge README as the whole database. This works for search indexing but becomes hard to maintain. AzhuTech should keep a readable README while storing entries in structured JSON.

### 4. Gallery structure beats list structure

The stronger image-focused repos use:

- `images/`,
- `prompts/`,
- category grouping,
- scripts,
- generated pages.

AzhuTech should move toward a browsable gallery with prompt cards, generated images, tags, and copy buttons.

### 5. Research/dataset framing adds credibility

`poloclub/diffusiondb` has dataset and datasheet framing. For AzhuTech, a lightweight version is enough:

- observed star counts,
- prompt taxonomy,
- model notes,
- evaluation notes.

## Recommended AzhuTech Structure

Public repository:

- `README.md`
- `README.zh-CN.md`
- `catalog/prompts.json`
- `docs/research.md`
- `examples/generate.js`
- `docs/index.html`
- `assets/cover.svg`

Future website:

- category landing pages,
- search/filter,
- prompt copy buttons,
- before/after edit examples,
- generated image grid,
- prompt metadata.

## What To Avoid

- Bulk copying third-party prompt text.
- A giant README with no structure.
- Prompt cards without output images forever.
- Claiming model-specific benchmark quality without reproducible examples.
- Using prompt syntax from other image systems blindly for GPT Image 2.
