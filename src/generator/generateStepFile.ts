import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { QaEngineConfig } from "../config/schema";
import { getDomainSpec } from "../domains/domainSpecs";
import { toCamelCase, toPascalCase } from "../utils/casing";
import { formatTypeScriptFile } from "../utils/formatFile";
import { findExistingStepText, loadFramework } from "../scan/loadFramework";

type QaPackage = {
  domainKey: string;
  automationScenarios: string[];
  manualChecks: string[];
  impactedAreas: string[];
  clarificationQuestions: string[];
};

function escapeForStep(step: string): string {
  return step.replace(/"/g, '\\"');
}

function pageObjectFileBase(domainKey: string, suffix: string): string {
  const camel = toCamelCase(domainKey);
  return `${camel}${suffix.replace(/\.ts$/, "")}`;
}

export async function generateStepFile(
  repoRoot: string,
  cfg: QaEngineConfig
) {
  const qaPackagePath = path.join(repoRoot, ".qa-engine", "out", "qa-package.json");
  const raw = await readFile(qaPackagePath, "utf-8");
  const qaPackage: QaPackage = JSON.parse(raw);

  const framework = await loadFramework(repoRoot);

  const classBase = toPascalCase(qaPackage.domainKey);
  const className = `${classBase}${cfg.naming.pageObjectClassSuffix}`;
  const instanceName = `${toCamelCase(qaPackage.domainKey)}Page`;
  const pageObjectImportBase = pageObjectFileBase(qaPackage.domainKey, cfg.naming.pageObjectFileSuffix);

  const spec = getDomainSpec(qaPackage.domainKey);

  const stepDefinitions = spec?.steps ?? [
    { keyword: "Given" as const, text: "the user starts the flow", method: "openPage" },
    { keyword: "When" as const, text: "the user performs the action", method: "performAction" },
    { keyword: "Then" as const, text: "the expected result should be shown", method: "verifyResult" }
  ];

  const seen = new Set<string>();
  const skipped: string[] = [];
  const generated: typeof stepDefinitions = [];

  for (const step of stepDefinitions) {
    const key = `${step.keyword}|${step.text.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (findExistingStepText(framework, step.text)) {
      skipped.push(step.text);
      continue;
    }
    generated.push(step);
  }

  const stepsFileSuffix = cfg.naming.stepsFileSuffix;
  const stepFileBase = `${toCamelCase(qaPackage.domainKey)}${stepsFileSuffix}`;

  const lines: string[] = [];
  lines.push(`import { Given, When, Then } from "@wdio/cucumber-framework";`);
  lines.push(`import { ${className} } from "../pageobjects/${pageObjectImportBase}";`);
  lines.push(``);
  lines.push(`const ${instanceName} = new ${className}();`);
  lines.push(``);
  lines.push(`// Auto-generated step skeleton for domain: ${qaPackage.domainKey}`);
  if (skipped.length > 0) {
    lines.push(
      `// Skipped (already defined elsewhere in framework): ${skipped.join(" | ")}`
    );
  }
  lines.push(``);

  for (const step of generated) {
    lines.push(`${step.keyword}("${escapeForStep(step.text)}", async () => {`);
    lines.push(`  await ${instanceName}.${step.method}();`);
    lines.push(`});`);
    lines.push(``);
  }

  const outDir = path.join(repoRoot, ".qa-engine", "out", "step-definitions");
  await mkdir(outDir, { recursive: true });

  const stepFilePath = path.join(outDir, stepFileBase);
  await writeFile(stepFilePath, formatTypeScriptFile(lines.join("\n")), "utf-8");
}
