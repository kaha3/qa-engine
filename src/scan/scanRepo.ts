import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { QaEngineConfig } from "../config/schema";
import { scanSteps } from "./scanSteps";
import { scanPageObjects } from "./scanPageObjects";
import { scanLocators } from "./scanLocators";
import { FrameworkModel } from "./types";

export async function scanRepo(repoRoot: string, cfg: QaEngineConfig) {
  const steps = await scanSteps(repoRoot, cfg);
  const pageObjects = await scanPageObjects(repoRoot, cfg);
  const locators = await scanLocators(repoRoot, cfg);

  const model: FrameworkModel = {
    version: "1.0",
    scannedAt: new Date().toISOString(),
    repoRoot,
    suiteRoot: cfg.suiteRoot,
    paths: {
      featuresDir: cfg.paths.featuresDir,
      stepsDir: cfg.paths.stepsDir,
      pageObjectsDir: cfg.paths.pageObjectsDir,
      elementsDir: cfg.paths.elementsDir,
      elementListFile: cfg.paths.elementListFile,
      supportDir: cfg.paths.supportDir
    },
    steps,
    pageObjects,
    locators
  };

  const outDir = path.join(repoRoot, ".qa-engine");
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "framework.json"),
    JSON.stringify(model, null, 2),
    "utf-8"
  );
}