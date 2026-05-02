import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { QaEngineConfig } from "../config/schema";
import { getDomainSpec } from "../domains/domainSpecs";
import { findExistingLocatorNames, loadFramework } from "../scan/loadFramework";
import { formatTypeScriptFile } from "../utils/formatFile";

type QaPackage = {
  domainKey: string;
  automationScenarios: string[];
  manualChecks: string[];
  impactedAreas: string[];
  clarificationQuestions: string[];
};

function locatorFileName(cfg: QaEngineConfig, domainKey: string): string {
  const fileForDomain = cfg.locators.fileForDomainKey[domainKey];
  if (fileForDomain) return fileForDomain.endsWith(".ts") ? fileForDomain : `${fileForDomain}.ts`;

  const fallback = cfg.locators.fileForDomainKey[cfg.locators.defaultFileKey];
  return fallback?.endsWith(".ts") ? fallback : `${fallback ?? domainKey}.ts`;
}

export async function generateLocatorFile(
  repoRoot: string,
  cfg: QaEngineConfig
) {
  const qaPackagePath = path.join(repoRoot, ".qa-engine", "out", "qa-package.json");
  const raw = await readFile(qaPackagePath, "utf-8");
  const qaPackage: QaPackage = JSON.parse(raw);

  const framework = await loadFramework(repoRoot);

  const spec = getDomainSpec(qaPackage.domainKey);
  const allLocators = spec?.locators ?? ["MAIN_ELEMENT"];

  const fileName = locatorFileName(cfg, qaPackage.domainKey);
  const existingNames = findExistingLocatorNames(framework, fileName);

  const skipped: string[] = [];
  const newLocators = allLocators.filter((name) => {
    if (existingNames.has(name)) {
      skipped.push(name);
      return false;
    }
    return true;
  });

  const lines: string[] = [];
  lines.push(`// Auto-generated locator skeleton for domain: ${qaPackage.domainKey}`);
  if (skipped.length > 0) {
    lines.push(`// Skipped (already exported): ${skipped.join(", ")}`);
  }
  lines.push("");

  for (const locatorName of newLocators) {
    lines.push(`// TODO: provide a real selector for ${locatorName}`);
    lines.push(`export const ${locatorName} = "";`);
    lines.push("");
  }

  const outDir = path.join(repoRoot, ".qa-engine", "out", "elements");
  await mkdir(outDir, { recursive: true });

  const filePath = path.join(outDir, fileName);
  await writeFile(filePath, formatTypeScriptFile(lines.join("\n")), "utf-8");
}
