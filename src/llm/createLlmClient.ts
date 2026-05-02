import { QaEngineConfig } from "../config/schema";
import { LlmClient } from "./types";
import { FakeLlmClient } from "./fakeClient";
import { OpenAiClient } from "./openaiClient";

export function createLlmClient(cfg: QaEngineConfig): LlmClient {
  const provider = (cfg.llm.provider ?? "openai").toLowerCase();

  if (provider === "fake" || process.env.QA_ENGINE_FAKE_LLM === "1") {
    return new FakeLlmClient();
  }

  if (provider === "openai") {
    const apiKeyEnv = cfg.llm.apiKeyEnv ?? "OPENAI_API_KEY";
    const apiKey = process.env[apiKeyEnv];

    if (!apiKey) {
      console.warn(
        `[qa-engine] ${apiKeyEnv} not set — falling back to fake LLM client (offline mode).`
      );
      return new FakeLlmClient();
    }

    return new OpenAiClient({
      apiKey,
      model: cfg.llm.model,
      baseUrl: cfg.llm.baseUrl
    });
  }

  console.warn(
    `[qa-engine] Unknown LLM provider "${cfg.llm.provider}" — falling back to fake client.`
  );
  return new FakeLlmClient();
}
