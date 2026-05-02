import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { QaEngineConfig } from "../config/schema";
import { createLlmClient } from "../llm/createLlmClient";
import { GenerationMode, LlmError } from "../llm/types";

export type GenerateQaPackageOptions = {
  mode?: GenerationMode;
};

export async function generateQaPackage(
  repoRoot: string,
  cfg: QaEngineConfig,
  storyPath: string,
  options: GenerateQaPackageOptions = {}
) {
  const mode: GenerationMode = options.mode ?? "full";
  const rawStory = await readFile(path.resolve(repoRoot, storyPath), "utf-8");

  const llm = createLlmClient(cfg);

  let result;
  try {
    result = await llm.generateQaPackage({
      storyText: rawStory,
      mode,
      routing: cfg.routing.domainKeywordToKey
    });
  } catch (err) {
    if (err instanceof LlmError) {
      throw new Error(`[qa-engine] LLM (${llm.providerName}) failed: ${err.message}`);
    }
    throw err;
  }

  const outDir = path.join(repoRoot, ".qa-engine", "out");
  await mkdir(outDir, { recursive: true });

  const jsonPath = path.join(outDir, "qa-package.json");
  const mdPath = path.join(outDir, "qa-package.md");

  await writeFile(jsonPath, JSON.stringify(result, null, 2), "utf-8");

  const mdSections: string[] = [];
  mdSections.push(`# QA Package`, ``);
  mdSections.push(`## Domain Key`, result.domainKey, ``);
  mdSections.push(`## Mode`, mode, ``);
  mdSections.push(`## Automation Scenarios`);
  mdSections.push(...result.automationScenarios.map((x) => `- ${x}`), ``);

  if (mode === "full") {
    mdSections.push(`## Manual Checks`);
    mdSections.push(...result.manualChecks.map((x) => `- ${x}`), ``);
  }

  mdSections.push(`## Impacted Areas`);
  mdSections.push(...result.impactedAreas.map((x) => `- ${x}`), ``);
  mdSections.push(`## Clarification Questions`);
  mdSections.push(...result.clarificationQuestions.map((x) => `- ${x}`), ``);

  await writeFile(mdPath, mdSections.join("\n"), "utf-8");

  return result;
}
