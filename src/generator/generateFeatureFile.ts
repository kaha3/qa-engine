import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { QaEngineConfig } from "../config/schema";
import { getDomainSpec } from "../domains/domainSpecs";

type QaPackage = {
  domainKey: string;
  automationScenarios: string[];
  manualChecks: string[];
  impactedAreas: string[];
  clarificationQuestions: string[];
};

function getScenarioSteps(domainKey: string, title: string): string[] {
  const spec = getDomainSpec(domainKey);
  if (!spec) {
    return [
      "Given the user starts the flow",
      "When the user performs the action",
      "Then the expected result should be shown"
    ];
  }

  const lower = title.toLowerCase();

  if (domainKey === "sdd") {
    if (lower.includes("non-eligible zip")) {
      return [
        "Given the user is on the homepage",
        "When the user opens a supported product",
        "And the user enters a non-eligible ZIP code",
        "Then the user should not see Same Day Delivery option"
      ];
    }

    if (lower.includes("eligible zip")) {
      return [
        "Given the user is on the homepage",
        "When the user opens a supported product",
        "And the user enters an eligible ZIP code",
        "Then the user should see Same Day Delivery option"
      ];
    }

    if (lower.includes("shipping total updates")) {
      return [
        "Given the user is on the homepage",
        "When the user opens a supported product",
        "And the user enters an eligible ZIP code",
        "And the user selects Same Day Delivery",
        "Then the shipping total should be updated"
      ];
    }
  }

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

  const lines: string[] = [];
  lines.push(`@generated @p1`);
  lines.push(`Feature: ${title}`);
  lines.push("");

  qaPackage.automationScenarios.forEach((scenarioTitle) => {
    lines.push(`Scenario: ${scenarioTitle}`);
    for (const step of getScenarioSteps(qaPackage.domainKey, scenarioTitle)) {
      lines.push(`    ${step}`);
    }
    lines.push("");
  });

  const outDir = path.join(repoRoot, ".qa-engine", "out", "features");
await mkdir(outDir, { recursive: true });

const featureFilePath = path.join(outDir, `${qaPackage.domainKey}.feature`);
await writeFile(featureFilePath, lines.join("\n"), "utf-8");
}