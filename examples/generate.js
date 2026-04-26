import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

await loadEnv(path.join(repoRoot, ".env"));

const promptId = process.argv[2] ?? "product-hero";
const generateAll = promptId === "all" || process.argv.includes("--all");
const catalogPath = path.join(repoRoot, "catalog/prompts.json");
const prompts = JSON.parse(await readFile(catalogPath, "utf8"));
const entries = generateAll ? prompts : prompts.filter((item) => item.id === promptId);

if (entries.length === 0) {
  console.error(`Unknown prompt id: ${promptId}`);
  console.error(`Available ids: ${prompts.map((item) => item.id).join(", ")}`);
  process.exit(1);
}

const config = readConfig();
const outputDir = path.join(repoRoot, "assets/generated");
await mkdir(outputDir, { recursive: true });

for (const entry of entries) {
  const outputPath = path.join(outputDir, `${entry.id}.png`);
  console.log(`generating ${entry.id} -> ${path.relative(repoRoot, outputPath)}`);
  const result = await generateImage(entry, config);
  const image = result.data?.[0];

  if (!image?.b64_json) {
    throw new Error(`No base64 image returned for ${entry.id}.`);
  }

  await writeFile(outputPath, Buffer.from(image.b64_json, "base64"));
  console.log(`wrote ${path.relative(repoRoot, outputPath)}`);
}

async function generateImage(entry, config) {
  const request = {
    model: config.model ?? entry.model,
    prompt: entry.prompt,
    n: 1,
    size: entry.recommended_settings.size,
    quality: entry.recommended_settings.quality,
    background: entry.recommended_settings.background,
    output_format: "png"
  };

  const attempts = [
    request,
    withoutKeys(request, ["background"]),
    withoutKeys(request, ["background", "output_format"])
  ];

  let lastError;
  for (const body of attempts) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    const response = await fetch(config.generationUrl, {
      method: "POST",
      headers: config.headers,
      body: JSON.stringify(body),
      signal: controller.signal
    }).finally(() => clearTimeout(timeout));
    const text = await response.text();
    const data = parseJson(text);

    if (response.ok) {
      return data;
    }

    lastError = new Error(formatApiError(response, data, text));
    if (![400, 422].includes(response.status)) {
      break;
    }
  }

  throw lastError;
}

async function loadEnv(filePath) {
  try {
    await access(filePath);
  } catch {
    return;
  }

  const text = await readFile(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = stripQuotes(trimmed.slice(separator + 1).trim());
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function readConfig() {
  const apiKey = process.env.AZURE_API_KEY
    ?? process.env.AZURE_OPENAI_API_KEY
    ?? process.env.OPENAI_API_KEY;
  const baseUrl = process.env.AZURE_BASE_URL ?? process.env.OPENAI_BASE_URL;
  const deployment = process.env.AZURE_IMAGE_DEPLOYMENT;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";

  if (!apiKey) {
    throw new Error("Missing AZURE_API_KEY, AZURE_OPENAI_API_KEY, or OPENAI_API_KEY.");
  }

  if (baseUrl) {
    const azureLike = baseUrl.includes(".azure.com") || baseUrl.includes(".azure.us");
    return {
      generationUrl: new URL("images/generations", ensureTrailingSlash(baseUrl)).toString(),
      model: deployment,
      headers: authHeaders(apiKey, azureLike),
      timeoutMs: readTimeout()
    };
  }

  if (endpoint && deployment) {
    const base = ensureTrailingSlash(endpoint);
    return {
      generationUrl: `${base}openai/deployments/${encodeURIComponent(deployment)}/images/generations?api-version=${encodeURIComponent(apiVersion)}`,
      model: deployment,
      headers: authHeaders(apiKey, true),
      timeoutMs: readTimeout()
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      generationUrl: "https://api.openai.com/v1/images/generations",
      model: undefined,
      headers: authHeaders(apiKey, false),
      timeoutMs: readTimeout()
    };
  }

  throw new Error("Missing AZURE_BASE_URL, AZURE_OPENAI_ENDPOINT + AZURE_IMAGE_DEPLOYMENT, or OPENAI_API_KEY.");
}

function authHeaders(apiKey, azureLike) {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  };
  if (azureLike) {
    headers["api-key"] = apiKey;
  }
  return headers;
}

function readTimeout() {
  return Number(process.env.IMAGE_REQUEST_TIMEOUT_MS ?? 600000);
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function withoutKeys(value, keys) {
  const next = { ...value };
  for (const key of keys) {
    delete next[key];
  }
  return next;
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function formatApiError(response, data, text) {
  const message = data?.error?.message ?? data?.message ?? text;
  return `Image generation failed (${response.status} ${response.statusText}): ${message}`;
}
