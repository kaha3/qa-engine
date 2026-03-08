import { QaEngineConfig } from "../config/schema";
import { generateQaPackage } from "./generateQaPackage";
import { generateFeatureFile } from "./generateFeatureFile";
import { generateStepFile } from "./generateStepFile";
import { generatePageObjectFile } from "./generatePageObjectFile";
import { generateLocatorFile } from "./generateLocatorFile";

export async function generateAll(
  repoRoot: string,
  cfg: QaEngineConfig,
  storyPath: string
) {
  await generateQaPackage(repoRoot, cfg, storyPath);
  await generateFeatureFile(repoRoot, cfg);
  await generateStepFile(repoRoot, cfg);
  await generatePageObjectFile(repoRoot, cfg);
  await generateLocatorFile(repoRoot, cfg);
}