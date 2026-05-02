import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { QaEngineConfig } from "../config/schema";
import { getDomainSpec } from "../domains/domainSpecs";
import { formatFeatureFile } from "../utils/formatFile";

type QaPackage = {
  domainKey: string;
  automationScenarios: string[];
  manualChecks: string[];
  impactedAreas: string[];
  clarificationQuestions: string[];
};

function stepsForScenario(domainKey: string, title: string): string[] {
  const spec = getDomainSpec(domainKey);
  if (!spec) {
    return genericSteps();
  }

  const normalizedTitle = title.trim().toLowerCase();
  const exact = spec.scenarios.find((s) => s.title.trim().toLowerCase() === normalizedTitle);
  if (exact) return exact.steps;

  const partial = spec.scenarios.find(
    (s) =>
      normalizedTitle.includes(s.title.trim().toLowerCase()) ||
      s.title.trim().toLowerCase().includes(normalizedTitle)
  );
  if (partial) return partial.steps;

  return genericSteps();
}

function genericSteps(): string[] {
  return [
    "Given the user starts the flow",
    "When the user performs the action",
    "Then the expected result should be shown"
  ];
}

export async function generateFeatureFile(
  repoRoot: string,
  cfg: QaEngineConfig
) {
  const qaPackagePath = path.join(repoRoot, ".qa-engine", "out", "qa-package.json");
  const raw = await readFile(qaPackagePath, "utf-8");
  const qaPackage: QaPackage = JSON.parse(raw);

  const spec = getDomainSpec(qaPackage.domainKey);
  const title = spec?.featureTitle ?? qaPackage.domainKey;

  const tags = cfg.generation.defaultTags.length > 0
    ? cfg.generation.defaultTags.join(" ")
    : "@p1";

  const lines: string[] = [];
  lines.push(`@generated ${tags}`);
  lines.push(`Feature: ${title}`);
  lines.push("");

  qaPackage.automationScenarios.forEach((scenarioTitle) => {
    lines.push(`Scenario: ${scenarioTitle}`);
    for (const step of stepsForScenario(qaPackage.domainKey, scenarioTitle)) {
      lines.push(`    ${step}`);
    }
    lines.push("");
  });

  const outDir = path.join(repoRoot, ".qa-engine", "out", "features");
  await mkdir(outDir, { recursive: true });

  const featureFilePath = path.join(outDir, `${qaPackage.domainKey}.feature`);
  await writeFile(featureFilePath, formatFeatureFile(lines.join("\n")), "utf-8");
}
