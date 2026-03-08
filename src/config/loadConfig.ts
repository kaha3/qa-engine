import path from "path";
import { readFile } from "fs/promises";
import { QaEngineConfigSchema, QaEngineConfig } from "./schema";

export async function loadConfig(repoRoot: string): Promise<QaEngineConfig> {
  const configPath = path.join(repoRoot, "qa-engine.config.json");
  const raw = await readFile(configPath, "utf-8");
  const json = JSON.parse(raw);
  return QaEngineConfigSchema.parse(json);
}