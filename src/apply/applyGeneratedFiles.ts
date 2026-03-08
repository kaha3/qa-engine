import path from "path";
import { mkdir, copyFile, access, constants } from "fs/promises";
import { QaEngineConfig } from "../config/schema";
import { mergeFeatureFile } from "./mergeFeatureFile";
import { mergeStepFile } from "./mergeStepFile";
import { mergeLocatorFile } from "./mergeLocatorFile";
import { mergePageObjectFile } from "./mergePageObjectFile";

export async function applyGeneratedFiles(
  repoRoot: string,
  cfg: QaEngineConfig
) {
  const outRoot = path.join(repoRoot, ".qa-engine", "out");

  const mappings = [
    {
      type: "feature" as const,
      from: path.join(outRoot, "features"),
      to: path.join(repoRoot, cfg.paths.featuresDir)
    },
    {
      type: "steps" as const,
      from: path.join(outRoot, "step-definitions"),
      to: path.join(repoRoot, cfg.paths.stepsDir)
    },
    {
      type: "pageobjects" as const,
      from: path.join(outRoot, "pageobjects"),
      to: path.join(repoRoot, cfg.paths.pageObjectsDir)
    },
    {
      type: "locators" as const,
      from: path.join(outRoot, "elements"),
      to: path.join(repoRoot, cfg.paths.elementsDir)
    }
  ];

  for (const mapping of mappings) {
    await mkdir(mapping.to, { recursive: true });

    const files = await getFiles(mapping.from);

    for (const file of files) {
      const fileName = path.basename(file);
      const targetPath = path.join(mapping.to, fileName);

      if (mapping.type === "feature") {
        const result = await mergeFeatureFile(file, targetPath);

        if (result.created) {
          console.log(`Created feature file: ${targetPath}`);
        } else {
          console.log(`Processed feature file: ${targetPath}`);
          if (result.addedScenarios.length > 0) {
            console.log(`  Added scenarios: ${result.addedScenarios.join(", ")}`);
          }
          if (result.skippedScenarios.length > 0) {
            console.log(`  Skipped existing scenarios: ${result.skippedScenarios.join(", ")}`);
          }
        }
      } else if (mapping.type === "steps") {
        const result = await mergeStepFile(file, targetPath);

        if (result.created) {
          console.log(`Created step file: ${targetPath}`);
        } else {
          console.log(`Processed step file: ${targetPath}`);
          if (result.addedSteps.length > 0) {
            console.log(`  Added steps: ${result.addedSteps.join(", ")}`);
          }
          if (result.skippedSteps.length > 0) {
            console.log(`  Skipped existing steps: ${result.skippedSteps.join(", ")}`);
          }
        }
      } else if (mapping.type === "pageobjects") {
        const result = await mergePageObjectFile(file, targetPath);

        if (result.created) {
          console.log(`Created page object file: ${targetPath}`);
        } else {
          console.log(`Processed page object file: ${targetPath}`);
          if (result.addedMethods.length > 0) {
            console.log(`  Added methods: ${result.addedMethods.join(", ")}`);
          }
          if (result.skippedMethods.length > 0) {
            console.log(`  Skipped existing methods: ${result.skippedMethods.join(", ")}`);
          }
        }
      } else if (mapping.type === "locators") {
        const result = await mergeLocatorFile(file, targetPath);

        if (result.created) {
          console.log(`Created locator file: ${targetPath}`);
        } else {
          console.log(`Processed locator file: ${targetPath}`);
          if (result.addedLocators.length > 0) {
            console.log(`  Added locators: ${result.addedLocators.join(", ")}`);
          }
          if (result.skippedLocators.length > 0) {
            console.log(`  Skipped existing locators: ${result.skippedLocators.join(", ")}`);
          }
        }
      } else {
        const exists = await fileExists(targetPath);

        if (exists) {
          console.log(`Skipped existing file: ${targetPath}`);
        } else {
          await copyFile(file, targetPath);
          console.log(`Created file: ${targetPath}`);
        }
      }
    }
  }
}

async function getFiles(dir: string): Promise<string[]> {
  const fs = await import("fs/promises");
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}