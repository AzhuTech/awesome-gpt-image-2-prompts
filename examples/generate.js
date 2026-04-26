import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";

const promptId = process.argv[2] ?? "product-hero";
const catalogPath = path.resolve("../catalog/prompts.json");
const prompts = JSON.parse(await readFile(catalogPath, "utf8"));
const entry = prompts.find((item) => item.id === promptId);

if (!entry) {
  console.error(`Unknown prompt id: ${promptId}`);
  console.error(`Available ids: ${prompts.map((item) => item.id).join(", ")}`);
  process.exit(1);
}

const client = new OpenAI();
const result = await client.images.generate({
  model: entry.model,
  prompt: entry.prompt,
  size: entry.recommended_settings.size,
  quality: entry.recommended_settings.quality,
  background: entry.recommended_settings.background
});

const image = result.data?.[0];

if (!image?.b64_json) {
  console.error("No base64 image returned by the API.");
  process.exit(1);
}

await mkdir("out", { recursive: true });
const outputPath = path.join("out", `${entry.id}.png`);
await writeFile(outputPath, Buffer.from(image.b64_json, "base64"));
console.log(`wrote ${outputPath}`);

