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

export async function generateLocatorFile(
  repoRoot: string,
  cfg: QaEngineConfig
) {
  const qaPackagePath = path.join(repoRoot, ".qa-engine", "out", "qa-package.json");
  const raw = await readFile(qaPackagePath, "utf-8");
  const qaPackage: QaPackage = JSON.parse(raw);

  const spec = getDomainSpec(qaPackage.domainKey);
  const locatorNames = spec?.locators ?? ["MAIN_ELEMENT"];

  const lines: string[] = [];
  lines.push(`// Auto-generated locator skeleton for domain: ${qaPackage.domainKey}`);
  lines.push("");

  for (const locatorName of locatorNames) {
    lines.push(`export const ${locatorName} = "";`);
  }

  lines.push("");

  const outDir = path.join(repoRoot, ".qa-engine", "out", "elements");
await mkdir(outDir, { recursive: true });

const filePath = path.join(outDir, `${qaPackage.domainKey}.ts`);
await writeFile(filePath, lines.join("\n"), "utf-8");
}