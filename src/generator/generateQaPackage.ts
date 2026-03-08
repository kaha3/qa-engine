import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { QaEngineConfig } from "../config/schema";
import { FakeLlmClient } from "../llm/fakeClient";

export async function generateQaPackage(
  repoRoot: string,
  cfg: QaEngineConfig,
  storyPath: string
) {
  const rawStory = await readFile(path.resolve(repoRoot, storyPath), "utf-8");

  const llm = new FakeLlmClient();
  const result = await llm.generateQaPackage({ storyText: rawStory });

  const outDir = path.join(repoRoot, ".qa-engine", "out");
  await mkdir(outDir, { recursive: true });

  const jsonPath = path.join(outDir, "qa-package.json");
  const mdPath = path.join(outDir, "qa-package.md");

  await writeFile(jsonPath, JSON.stringify(result, null, 2), "utf-8");

  const md = [
    `# QA Package`,
    ``,
    `## Domain Key`,
    `${result.domainKey}`,
    ``,
    `## Automation Scenarios`,
    ...result.automationScenarios.map((x) => `- ${x}`),
    ``,
    `## Manual Checks`,
    ...result.manualChecks.map((x) => `- ${x}`),
    ``,
    `## Impacted Areas`,
    ...result.impactedAreas.map((x) => `- ${x}`),
    ``,
    `## Clarification Questions`,
    ...result.clarificationQuestions.map((x) => `- ${x}`),
    ``
  ].join("\n");

  await writeFile(mdPath, md, "utf-8");
}