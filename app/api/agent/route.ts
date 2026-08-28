type Provider = "openai" | "gemini" | "anthropic";

type Citation = { title: string; url: string };

const DISCOVERY_PROMPT = (message: string) => `
You are the live-web research layer for an Australian shopping comparison app.

User request: ${JSON.stringify(message)}

Search the current public web for up to three credible Australian offers that
appear to match the request. Be conservative. Exclude refurbished or used
items, trade-in headline prices, carrier contracts, instalment-only prices,
different storage/model variants, and out-of-stock listings unless requested.

Write one concise paragraph for a shopper. Name the product specification you
matched, mention delivered prices only when the source establishes them, and
state any uncertainty. Do not claim that this search is exhaustive. Do not
include Northstar, DirectMart, or TechHaven; those are simulated local stores
that the application compares separately. Keep source citations enabled.
`.trim();

function uniqueCitations(citations: Citation[]) {
  const seen = new Set<string>();
  return citations
    .filter((citation) => {
      if (!citation.url || seen.has(citation.url)) return false;
      seen.add(citation.url);
      return true;
    })
    .slice(0, 6);
}

function collectUrlObjects(value: unknown, results: Citation[] = []): Citation[] {
  if (!value || typeof value !== "object") return results;
  if (Array.isArray(value)) {
    value.forEach((item) => collectUrlObjects(item, results));
    return results;
  }
  const object = value as Record<string, unknown>;
  const url =
    typeof object.url === "string"
      ? object.url
      : typeof object.uri === "string"
        ? object.uri
        : undefined;
  if (url?.startsWith("http")) {
    const title =
      typeof object.title === "string"
        ? object.title
        : typeof object.domain === "string"
          ? object.domain
          : new URL(url).hostname;
    results.push({ title, url });
  }
  Object.values(object).forEach((item) => collectUrlObjects(item, results));
  return results;
}

function collectText(value: unknown, results: string[] = []): string[] {
  if (!value || typeof value !== "object") return results;
  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, results));
    return results;
  }
  const object = value as Record<string, unknown>;
  if (
    typeof object.text === "string" &&
    ["output_text", "text"].includes(String(object.type ?? "text"))
  ) {
    results.push(object.text);
  }
  Object.values(object).forEach((item) => collectText(item, results));
  return results;
}

async function requestJson(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(40_000),
  });
  const payload = await response.json();
  if (!response.ok) {
    const message =
      payload?.error?.message ?? payload?.message ?? `Provider returned ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

async function searchOpenAI(message: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const payload = await requestJson("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      tools: [{ type: "web_search", user_location: { type: "approximate", country: "AU" } }],
      input: DISCOVERY_PROMPT(message),
    }),
  });

  const text = collectText(payload.output).join("\n").trim();
  return {
    summary: text || "The provider completed its search but returned no readable summary.",
    citations: uniqueCitations(collectUrlObjects(payload.output)),
  };
}

async function searchGemini(message: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const payload = await requestJson(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash",
        input: DISCOVERY_PROMPT(message),
        tools: [{ type: "google_search" }],
      }),
    },
  );
  const summary =
    (typeof payload.output_text === "string" && payload.output_text) ||
    collectText(payload).join("\n").trim();
  return {
    summary: summary || "The provider completed its search but returned no readable summary.",
    citations: uniqueCitations(collectUrlObjects(payload)),
  };
}

async function searchAnthropic(message: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  const payload = await requestJson("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",
      max_tokens: 900,
      messages: [{ role: "user", content: DISCOVERY_PROMPT(message) }],
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 4,
          user_location: { type: "approximate", country: "AU" },
        },
      ],
    }),
  });
  const summary = collectText(payload.content).join("\n").trim();
  return {
    summary: summary || "The provider completed its search but returned no readable summary.",
    citations: uniqueCitations(collectUrlObjects(payload.content)),
  };
}

export async function GET() {
  return Response.json({
    providers: {
      openai: Boolean(process.env.OPENAI_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message?: string; provider?: Provider };
    const message = body.message?.trim();
    const provider = body.provider;
    if (!message || !provider) {
      return Response.json({ error: "message and provider are required" }, { status: 400 });
    }
    if (message.length > 1_000) {
      return Response.json({ error: "Shopping request is too long" }, { status: 400 });
    }

    const result =
      provider === "openai"
        ? await searchOpenAI(message)
        : provider === "gemini"
          ? await searchGemini(message)
          : await searchAnthropic(message);

    return Response.json({ provider, ...result });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Live search failed" },
      { status: 502 },
    );
  }
}
