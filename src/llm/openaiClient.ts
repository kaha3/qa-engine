import { LlmClient, QaPackageInput, QaPackageResult, LlmError } from "./types";
import { QaPackageResponseSchema } from "./qaPackageSchema";

type OpenAiClientOptions = {
  apiKey: string;
  model: string;
  baseUrl?: string;
};

export class OpenAiClient implements LlmClient {
  readonly providerName = "openai";

  constructor(private readonly opts: OpenAiClientOptions) {}

  async generateQaPackage(input: QaPackageInput): Promise<QaPackageResult> {
    const baseUrl = this.opts.baseUrl ?? "https://api.openai.com";
    const url = `${baseUrl.replace(/\/+$/, "")}/v1/chat/completions`;

    const systemPrompt = buildSystemPrompt(input);
    const userPrompt = buildUserPrompt(input);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.opts.apiKey}`
        },
        body: JSON.stringify({
          model: this.opts.model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.2
        })
      });
    } catch (err) {
      throw new LlmError("OpenAI request failed (network error)", err);
    }

    if (!response.ok) {
      const body = await safeText(response);
      throw new LlmError(
        `OpenAI request failed: HTTP ${response.status} ${response.statusText} - ${body.slice(0, 400)}`
      );
    }

    let payload: any;
    try {
      payload = await response.json();
    } catch (err) {
      throw new LlmError("OpenAI response was not valid JSON", err);
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new LlmError("OpenAI response did not include a message content string");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      throw new LlmError("OpenAI message content was not parseable JSON", err);
    }

    const result = QaPackageResponseSchema.safeParse(parsed);
    if (!result.success) {
      throw new LlmError(
        `OpenAI response did not match expected QA package schema: ${result.error.message}`
      );
    }

    if (input.mode === "automation") {
      return { ...result.data, manualChecks: [] };
    }
    return result.data;
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function buildSystemPrompt(input: QaPackageInput): string {
  const knownKeys = Object.values(input.routing);
  const uniqueKeys = Array.from(new Set(knownKeys));
  return [
    "You are a senior QA engineer working on a WebdriverIO + Cucumber + TypeScript test framework.",
    "Given a Jira-style user story you must produce a structured QA package as JSON.",
    "Output must match this exact JSON shape (no markdown, no commentary):",
    `{`,
    `  "domainKey": string,`,
    `  "automationScenarios": string[],`,
    `  "manualChecks": string[],`,
    `  "impactedAreas": string[],`,
    `  "clarificationQuestions": string[]`,
    `}`,
    "",
    `Pick "domainKey" from this list when possible: ${uniqueKeys.join(", ")}.`,
    `If nothing fits, use "general".`,
    `Mode is "${input.mode}". When mode is "automation", return manualChecks as [].`,
    "automationScenarios should be short, distinct, and automatable.",
    "clarificationQuestions should surface real ambiguity in the story."
  ].join("\n");
}

function buildUserPrompt(input: QaPackageInput): string {
  return ["Story:", "```", input.storyText.trim(), "```"].join("\n");
}
