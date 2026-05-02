import { Command } from "commander";
import { loadConfig } from "./config/loadConfig";
import { scanRepo } from "./scan/scanRepo";
import { generateQaPackage } from "./generator/generateQaPackage";
import { generateFeatureFile } from "./generator/generateFeatureFile";
import { generateStepFile } from "./generator/generateStepFile";
import { generatePageObjectFile } from "./generator/generatePageObjectFile";
import { generateLocatorFile } from "./generator/generateLocatorFile";
import { generateAll } from "./generator/generateAll";
import { applyGeneratedFiles } from "./apply/applyGeneratedFiles";
import { initConfig } from "./init/initConfig";
import { GenerationMode } from "./llm/types";

const program = new Command();

function parseMode(value: string): GenerationMode {
  const normalized = value.toLowerCase();
  if (normalized === "automation" || normalized === "full") return normalized;
  throw new Error(`Invalid --mode "${value}". Use "automation" or "full".`);
}

program
  .name("qa-engine")
  .description("QA Engine - framework-aware automation generator")
  .version("0.1.0");

program
  .command("init")
  .description("Interactively create qa-engine.config.json")
  .action(async () => {
    const repoRoot = process.cwd();
    await initConfig(repoRoot);
  });

program
  .command("scan")
  .description("Scan repo and build .qa-engine/framework.json")
  .action(async () => {
    const repoRoot = process.cwd();
    const cfg = await loadConfig(repoRoot);
    await scanRepo(repoRoot, cfg);
    console.log("Scan complete. Saved .qa-engine/framework.json");
  });

program
  .command("generate")
  .description("Generate QA package from a Jira-style story text file")
  .requiredOption("--story <path>", "Path to the story text file")
  .option("--mode <mode>", "automation | full (controls manual checks)", "full")
  .action(async (options) => {
    const repoRoot = process.cwd();
    const cfg = await loadConfig(repoRoot);
    const mode = parseMode(options.mode);
    await generateQaPackage(repoRoot, cfg, options.story, { mode });
    console.log(`QA package generated in .qa-engine/out/ (mode=${mode})`);
  });

program
  .command("generate-feature")
  .description("Generate a feature file from .qa-engine/out/qa-package.json")
  .action(async () => {
    const repoRoot = process.cwd();
    const cfg = await loadConfig(repoRoot);
    await generateFeatureFile(repoRoot, cfg);
    console.log("Feature file generated in .qa-engine/out/");
  });

program
  .command("generate-steps")
  .description("Generate step definition skeleton from .qa-engine/out/qa-package.json")
  .action(async () => {
    const repoRoot = process.cwd();
    const cfg = await loadConfig(repoRoot);
    await generateStepFile(repoRoot, cfg);
    console.log("Step definition skeleton generated in .qa-engine/out/");
  });

program
  .command("generate-pageobject")
  .description("Generate page object skeleton from .qa-engine/out/qa-package.json")
  .action(async () => {
    const repoRoot = process.cwd();
    const cfg = await loadConfig(repoRoot);
    await generatePageObjectFile(repoRoot, cfg);
    console.log("Page object skeleton generated in .qa-engine/out/");
  });

program
  .command("generate-locators")
  .description("Generate locator skeleton file from .qa-engine/out/qa-package.json")
  .action(async () => {
    const repoRoot = process.cwd();
    const cfg = await loadConfig(repoRoot);
    await generateLocatorFile(repoRoot, cfg);
    console.log("Locator skeleton generated in .qa-engine/out/");
  });

program
  .command("generate-all")
  .description("Generate full QA output package from a Jira-style story text file")
  .requiredOption("--story <path>", "Path to the story text file")
  .option("--mode <mode>", "automation | full (controls manual checks)", "full")
  .action(async (options) => {
    const repoRoot = process.cwd();
    const cfg = await loadConfig(repoRoot);
    const mode = parseMode(options.mode);
    await generateAll(repoRoot, cfg, options.story, { mode });
    console.log(`Full QA output generated in .qa-engine/out/ (mode=${mode})`);
  });

program
  .command("apply")
  .description("Apply generated preview files into the framework structure")
  .option("--dry-run", "Show what would be created/merged without writing files")
  .option("--force", "Overwrite existing target files instead of merging")
  .option("--patch", "Write a unified diff to the configured patch file instead of writing target files")
  .action(async (options) => {
    const repoRoot = process.cwd();
    const cfg = await loadConfig(repoRoot);
    await applyGeneratedFiles(repoRoot, cfg, {
      dryRun: Boolean(options.dryRun),
      force: Boolean(options.force),
      patch: Boolean(options.patch)
    });
  });

program.parseAsync(process.argv);
