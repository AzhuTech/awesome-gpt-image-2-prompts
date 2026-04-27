# Awesome GPT Image 2 Prompts

[![License: CC0-1.0](https://img.shields.io/badge/license-CC0--1.0-blue.svg)](LICENSE)
[![Docs: 中文](https://img.shields.io/badge/docs-中文-yellow.svg)](README.zh-CN.md)

English | [中文](README.zh-CN.md)

Curated high-impact prompt recipes and a visual gallery for `gpt-image-2`.

This repository turns shareable image prompting patterns into clean, copy-ready GPT Image 2 recipes with structured metadata and generated demo images.

![Awesome GPT Image 2 Prompts cover](assets/cover.svg)

## Why This Exists

Most prompt collections are long README dumps. They are useful for search, but hard to compare, filter, test, or turn into repeatable visual workflows.

This repo keeps prompts in structured JSON and renders a gallery so the collection stays easy to search, test, and extend.

## Gallery

The gallery pairs every recipe with a generated output image so the repository feels like a visual catalog, not a prompt dump.

![Boss arena key art generated output](assets/generated/boss-arena-key-art.png)

## Quick Browse

| Category | Use case | Example |
| --- | --- | --- |
| Game art | Key art, covers, RPG assets | Boss arenas, cyberpunk covers, cozy RPG villages |
| Anime character | Splash art and collectible cards | Gacha heroes, mecha pilots, dark fantasy card art |
| Cinematic film | Movie-frame prompts | Neon noir, space opera, desert chase frames |
| Beauty photography | Editorial portrait prompts | Golden hour, neon studio, vintage film portraits |
| Commercial | Brand and product visuals | Product hero shots, packaging systems, SaaS launch art |
| Utility design | Reusable prompt tests | Mascots, diagrams, sticker sheets, architecture concepts |

Browse the structured catalog:

- [catalog/prompts.json](catalog/prompts.json)
- [docs/research.md](docs/research.md)

Open the static demo gallery:

- [docs/index.html](docs/index.html)

## Generate A Demo Image

```bash
cd examples
npm run generate -- product-hero
npm run generate:all
npm run generate:missing
```

The example script reads Azure/OpenAI-compatible settings from `.env` and writes generated images to `assets/generated/`.

## Prompt Card Format

Each prompt entry includes:

- `id`
- `title`
- `title_zh`
- `category`
- `model`
- `preview_image` (generated output path)
- `prompt`
- `prompt_zh`
- `recommended_settings`
- `tags`
- `notes`
- `notes_zh`

The public catalog contains original GPT Image 2 recipes written for this repository. Internal source research is maintained privately so this repo stays focused on AzhuTech's prompt library and demos.

## Roadmap

- Add 100 curated prompt recipes.
- Add category pages and search.
- Add before/after image-edit examples.
- Add prompt evaluation notes for text rendering, layout control, product fidelity, and character consistency.
- Add Chinese prompt variants.

## License

Prompt recipes in this repository are released under CC0-1.0 unless otherwise noted.
