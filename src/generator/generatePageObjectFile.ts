import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { QaEngineConfig } from "../config/schema";
import { getDomainSpec } from "../domains/domainSpecs";
import { toCamelCase, toPascalCase } from "../utils/casing";
import { formatTypeScriptFile } from "../utils/formatFile";
import { findExistingPageObjectClass, loadFramework } from "../scan/loadFramework";

type QaPackage = {
  domainKey: string;
  automationScenarios: string[];
  manualChecks: string[];
  impactedAreas: string[];
  clarificationQuestions: string[];
};

function locatorFileImportBase(cfg: QaEngineConfig, domainKey: string): string {
  const fileForDomain = cfg.locators.fileForDomainKey[domainKey];
  if (fileForDomain) return fileForDomain.replace(/\.ts$/, "");
  const fallback = cfg.locators.fileForDomainKey[cfg.locators.defaultFileKey];
  return (fallback ?? `${domainKey}.ts`).replace(/\.ts$/, "");
}

export async function generatePageObjectFile(
  repoRoot: string,
  cfg: QaEngineConfig
) {
  const qaPackagePath = path.join(repoRoot, ".qa-engine", "out", "qa-package.json");
  const raw = await readFile(qaPackagePath, "utf-8");
  const qaPackage: QaPackage = JSON.parse(raw);

  const framework = await loadFramework(repoRoot);

  const classBase = toPascalCase(qaPackage.domainKey);
  const className = `${classBase}${cfg.naming.pageObjectClassSuffix}`;
  const existingClass = findExistingPageObjectClass(framework, className);

  const spec = getDomainSpec(qaPackage.domainKey);

  const getters = spec?.getters ?? [{ name: "mainElement", locator: "MAIN_ELEMENT" }];
  const methods =
    spec?.methods ?? [
      { name: "openPage", body: [`// TODO: implement openPage`] },
      { name: "performAction", body: [`// TODO: implement performAction`] },
      { name: "verifyResult", body: [`// TODO: implement verifyResult`] }
    ];

  const existingMethodNames = new Set(existingClass?.methods ?? []);
  const skippedMethods: string[] = [];
  const generatedMethods = methods.filter((m) => {
    if (existingMethodNames.has(m.name)) {
      skippedMethods.push(m.name);
      return false;
    }
    return true;
  });

  const locatorImportBase = locatorFileImportBase(cfg, qaPackage.domainKey);

  const lines: string[] = [];
  lines.push(`import * as elmList from "../elements/${locatorImportBase}";`);
  lines.push(``);
  lines.push(`// Auto-generated page object skeleton for domain: ${qaPackage.domainKey}`);
  if (existingClass) {
    lines.push(`// Existing class detected at ${existingClass.file} — methods present there are not re-emitted.`);
  }
  if (skippedMethods.length > 0) {
    lines.push(`// Skipped methods (already on existing class): ${skippedMethods.join(", ")}`);
  }
  lines.push(``);
  lines.push(`export class ${className} {`);

  for (const getter of getters) {
    lines.push(`  get ${getter.name}() {`);
    lines.push(`    return $(elmList.${getter.locator});`);
    lines.push(`  }`);
    lines.push(``);
  }

  for (const method of generatedMethods) {
    lines.push(`  public async ${method.name}(): Promise<void> {`);
    for (const bodyLine of method.body) {
      lines.push(`    ${bodyLine}`);
    }
    lines.push(`  }`);
    lines.push(``);
  }

  lines.push(`}`);

  const outDir = path.join(repoRoot, ".qa-engine", "out", "pageobjects");
  await mkdir(outDir, { recursive: true });

  const camel = toCamelCase(qaPackage.domainKey);
  const fileSuffix = cfg.naming.pageObjectFileSuffix;
  const fileName = `${camel}${fileSuffix}`;
  const filePath = path.join(outDir, fileName);
  await writeFile(filePath, formatTypeScriptFile(lines.join("\n")), "utf-8");
}
