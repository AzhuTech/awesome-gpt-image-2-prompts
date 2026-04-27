import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

await loadEnv(path.join(repoRoot, ".env"));

const args = process.argv.slice(2);
const promptIds = args.filter((arg) => !arg.startsWith("--"));
const generateAll = promptIds.includes("all") || args.includes("--all");
const generateMissing = args.includes("--missing");
const catalogPath = path.join(repoRoot, "catalog/prompts.json");
const prompts = JSON.parse(await readFile(catalogPath, "utf8"));
const selectedIds = promptIds.filter((id) => id !== "all");
const entries = generateAll || selectedIds.length === 0
  ? prompts
  : prompts.filter((item) => selectedIds.includes(item.id));

if (entries.length === 0) {
  console.error(`Unknown prompt id: ${selectedIds.join(", ")}`);
  console.error(`Available ids: ${prompts.map((item) => item.id).join(", ")}`);
  process.exit(1);
}

const config = readConfig();
const outputDir = path.join(repoRoot, "assets/generated");
await mkdir(outputDir, { recursive: true });

for (const entry of entries) {
  const outputPath = path.join(outputDir, `${entry.id}.png`);
  if (generateMissing && await fileExists(outputPath)) {
    console.log(`skip existing ${path.relative(repoRoot, outputPath)}`);
    continue;
  }
  console.log(`generating ${entry.id} -> ${path.relative(repoRoot, outputPath)}`);
  const result = await generateImage(entry, config);
  const image = result.data?.[0];

  if (!image?.b64_json) {
    throw new Error(`No base64 image returned for ${entry.id}.`);
  }

  await writeFile(outputPath, Buffer.from(image.b64_json, "base64"));
  console.log(`wrote ${path.relative(repoRoot, outputPath)}`);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
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
    for (let retry = 0; retry <= config.maxRetries; retry += 1) {
      try {
        const response = await requestImage(config, body);
        const text = await response.text();
        const data = parseJson(text);

        if (response.ok) {
          return data;
        }

        lastError = new Error(formatApiError(response, data, text));
        if (![408, 409, 425, 429, 500, 502, 503, 504].includes(response.status)) {
          break;
        }
      } catch (error) {
        lastError = error;
      }

      if (retry < config.maxRetries) {
        const delayMs = retryDelay(retry);
        console.warn(`retry ${retry + 1}/${config.maxRetries} after ${delayMs}ms: ${lastError.message}`);
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

async function requestImage(config, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    return await fetch(config.generationUrl, {
      method: "POST",
      headers: config.headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
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
      timeoutMs: readTimeout(),
      maxRetries: readRetries()
    };
  }

  if (endpoint && deployment) {
    const base = ensureTrailingSlash(endpoint);
    return {
      generationUrl: `${base}openai/deployments/${encodeURIComponent(deployment)}/images/generations?api-version=${encodeURIComponent(apiVersion)}`,
      model: deployment,
      headers: authHeaders(apiKey, true),
      timeoutMs: readTimeout(),
      maxRetries: readRetries()
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      generationUrl: "https://api.openai.com/v1/images/generations",
      model: undefined,
      headers: authHeaders(apiKey, false),
      timeoutMs: readTimeout(),
      maxRetries: readRetries()
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

function readRetries() {
  return Number(process.env.IMAGE_REQUEST_RETRIES ?? 3);
}

function retryDelay(retry) {
  return Math.min(60000, 5000 * 2 ** retry);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
