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

function toPascalCase(value: string): string {
  return value
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^./, (c) => c.toUpperCase());
}

function escapeForStep(step: string): string {
  return step.replace(/"/g, '\\"');
}

export async function generateStepFile(
  repoRoot: string,
  cfg: QaEngineConfig
) {
  const qaPackagePath = path.join(repoRoot, ".qa-engine", "out", "qa-package.json");
  const raw = await readFile(qaPackagePath, "utf-8");
  const qaPackage: QaPackage = JSON.parse(raw);

  const classBase = toPascalCase(qaPackage.domainKey);
  const className = `${classBase}PageObject`;
  const instanceName = `${qaPackage.domainKey}Page`;

  const spec = getDomainSpec(qaPackage.domainKey);

  const stepDefinitions = spec?.steps ?? [
    {
      keyword: "Given" as const,
      text: "the user starts the flow",
      method: "openPage"
    },
    {
      keyword: "When" as const,
      text: "the user performs the action",
      method: "performAction"
    },
    {
      keyword: "Then" as const,
      text: "the expected result should be shown",
      method: "verifyResult"
    }
  ];

  const lines: string[] = [];
  lines.push(`import { Given, When, Then } from "@wdio/cucumber-framework";`);
  lines.push(`import { ${className} } from "../pageobjects/${qaPackage.domainKey}Page";`);
  lines.push(``);
  lines.push(`const ${instanceName} = new ${className}();`);
  lines.push(``);
  lines.push(`// Auto-generated step skeleton for domain: ${qaPackage.domainKey}`);
  lines.push(``);

  for (const step of stepDefinitions) {
    lines.push(`${step.keyword}("${escapeForStep(step.text)}", async () => {`);
    lines.push(`  await ${instanceName}.${step.method}();`);
    lines.push(`});`);
    lines.push(``);
  }

  const outDir = path.join(repoRoot, ".qa-engine", "out", "step-definitions");
await mkdir(outDir, { recursive: true });

const stepFilePath = path.join(outDir, `${qaPackage.domainKey}.steps.ts`);
await writeFile(stepFilePath, lines.join("\n"), "utf-8");
}