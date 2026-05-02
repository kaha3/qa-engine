import { QaEngineConfig } from "../config/schema";
import { GenerationMode } from "../llm/types";
import { generateQaPackage } from "./generateQaPackage";
import { generateFeatureFile } from "./generateFeatureFile";
import { generateStepFile } from "./generateStepFile";
import { generatePageObjectFile } from "./generatePageObjectFile";
import { generateLocatorFile } from "./generateLocatorFile";

export type GenerateAllOptions = {
  mode?: GenerationMode;
};

export async function generateAll(
  repoRoot: string,
  cfg: QaEngineConfig,
  storyPath: string,
  options: GenerateAllOptions = {}
) {
  const mode: GenerationMode = options.mode ?? "full";

  await generateQaPackage(repoRoot, cfg, storyPath, { mode });
  await generateFeatureFile(repoRoot, cfg);
  await generateStepFile(repoRoot, cfg);
  await generatePageObjectFile(repoRoot, cfg);
  await generateLocatorFile(repoRoot, cfg);
}
