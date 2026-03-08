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

function methodBody(methodName: string): string[] {
  switch (methodName) {
    case "openHomePage":
      return [`    // TODO: replace with real URL`, `    await browser.url("/");`];
    case "openSupportedProduct":
      return [
        `    await this.supportedProductLink.waitForDisplayed();`,
        `    await this.supportedProductLink.click();`
      ];
    case "enterEligibleZipCode":
      return [
        `    await this.eligibleZipInput.waitForDisplayed();`,
        `    await this.eligibleZipInput.setValue("60601");`
      ];
    case "enterNonEligibleZipCode":
      return [
        `    await this.nonEligibleZipInput.waitForDisplayed();`,
        `    await this.nonEligibleZipInput.setValue("99999");`
      ];
    case "verifySameDayDeliveryVisible":
      return [`    await this.sameDayDeliveryOption.waitForDisplayed();`];
    case "verifySameDayDeliveryNotVisible":
      return [`    await expect(this.sameDayDeliveryOption).not.toBeDisplayed();`];
    case "selectSameDayDelivery":
      return [
        `    await this.sameDayDeliveryOption.waitForDisplayed();`,
        `    await this.sameDayDeliveryOption.click();`
      ];
    case "verifyShippingTotalUpdated":
      return [`    await this.shippingTotalLabel.waitForDisplayed();`];
    default:
      return [`    // TODO: implement method`];
  }
}

export async function generatePageObjectFile(
  repoRoot: string,
  cfg: QaEngineConfig
) {
  const qaPackagePath = path.join(repoRoot, ".qa-engine", "out", "qa-package.json");
  const raw = await readFile(qaPackagePath, "utf-8");
  const qaPackage: QaPackage = JSON.parse(raw);

  const classBase = toPascalCase(qaPackage.domainKey);
  const className = `${classBase}PageObject`;

  const spec = getDomainSpec(qaPackage.domainKey);

  const getters = spec?.getters ?? [
    { name: "mainElement", locator: "MAIN_ELEMENT" }
  ];

  const methods = spec?.methods ?? ["openPage", "performAction", "verifyResult"];

  const lines: string[] = [];
  lines.push(`import * as elmList from "../elements/${qaPackage.domainKey}";`);
  lines.push(``);
  lines.push(`// Auto-generated page object skeleton for domain: ${qaPackage.domainKey}`);
  lines.push(``);
  lines.push(`export class ${className} {`);

  for (const getter of getters) {
    lines.push(`  get ${getter.name}() {`);
    lines.push(`    return $(elmList.${getter.locator});`);
    lines.push(`  }`);
    lines.push(``);
  }

  for (const methodName of methods) {
    lines.push(`  public async ${methodName}(): Promise<void> {`);
    lines.push(...methodBody(methodName));
    lines.push(`  }`);
    lines.push(``);
  }

  lines.push(`}`);

  const outDir = path.join(repoRoot, ".qa-engine", "out", "pageobjects");
await mkdir(outDir, { recursive: true });

const filePath = path.join(outDir, `${qaPackage.domainKey}Page.ts`);
await writeFile(filePath, lines.join("\n"), "utf-8");
}