import path from "path";
import { mkdir, readFile, writeFile, access, constants, readdir } from "fs/promises";
import { QaEngineConfig } from "../config/schema";
import { mergeFeatureFile } from "./mergeFeatureFile";
import { mergeStepFile } from "./mergeStepFile";
import { mergeLocatorFile } from "./mergeLocatorFile";
import { mergePageObjectFile } from "./mergePageObjectFile";
import { unifiedDiff } from "../utils/diff";

export type ApplyOptions = {
  dryRun?: boolean;
  force?: boolean;
  patch?: boolean;
};

type FileTypeKey = "feature" | "steps" | "pageobjects" | "locators";

type FileMergeOutcome = {
  type: FileTypeKey;
  action: "created" | "merged" | "skipped" | "overwritten" | "noop";
  targetPath: string;
  oldContent: string;
  newContent: string;
  details: string[];
};

type Mapping = {
  type: FileTypeKey;
  from: string;
  to: string;
};

export async function applyGeneratedFiles(
  repoRoot: string,
  cfg: QaEngineConfig,
  options: ApplyOptions = {}
): Promise<FileMergeOutcome[]> {
  const outRoot = path.join(repoRoot, ".qa-engine", "out");

  const mappings: Mapping[] = [
    { type: "feature", from: path.join(outRoot, "features"), to: path.join(repoRoot, cfg.paths.featuresDir) },
    { type: "steps", from: path.join(outRoot, "step-definitions"), to: path.join(repoRoot, cfg.paths.stepsDir) },
    { type: "pageobjects", from: path.join(outRoot, "pageobjects"), to: path.join(repoRoot, cfg.paths.pageObjectsDir) },
    { type: "locators", from: path.join(outRoot, "elements"), to: path.join(repoRoot, cfg.paths.elementsDir) }
  ];

  const outcomes: FileMergeOutcome[] = [];

  for (const mapping of mappings) {
    if (!(await dirExists(mapping.from))) continue;

    const files = await getFiles(mapping.from);

    for (const generatedPath of files) {
      const fileName = path.basename(generatedPath);
      const targetPath = path.join(mapping.to, fileName);

      const outcome = await processFile(mapping.type, generatedPath, targetPath, options);
      outcomes.push(outcome);
    }
  }

  if (options.patch) {
    await writePatchFile(repoRoot, cfg, outcomes);
  } else if (!options.dryRun) {
    for (const outcome of outcomes) {
      if (outcome.action === "created" || outcome.action === "merged" || outcome.action === "overwritten") {
        await mkdir(path.dirname(outcome.targetPath), { recursive: true });
        await writeFile(outcome.targetPath, outcome.newContent, "utf-8");
      }
    }
  }

  printSummary(outcomes, options);

  return outcomes;
}

async function processFile(
  type: FileTypeKey,
  generatedPath: string,
  targetPath: string,
  options: ApplyOptions
): Promise<FileMergeOutcome> {
  const targetExists = await fileExists(targetPath);

  if (options.force && targetExists) {
    const generatedContent = await readFile(generatedPath, "utf-8");
    const oldContent = await readFile(targetPath, "utf-8");
    return {
      type,
      action: "overwritten",
      targetPath,
      oldContent,
      newContent: generatedContent,
      details: ["overwritten by --force"]
    };
  }

  if (type === "feature") {
    const r = await mergeFeatureFile(generatedPath, targetPath);
    return toOutcome(type, targetPath, r.action, r.oldContent, r.newContent, [
      ...r.addedScenarios.map((s) => `+ scenario: ${s}`),
      ...r.skippedScenarios.map((s) => `= scenario (already present): ${s}`)
    ]);
  }
  if (type === "steps") {
    const r = await mergeStepFile(generatedPath, targetPath);
    return toOutcome(type, targetPath, r.action, r.oldContent, r.newContent, [
      ...r.addedSteps.map((s) => `+ step: ${s}`),
      ...r.skippedSteps.map((s) => `= step (already present): ${s}`)
    ]);
  }
  if (type === "pageobjects") {
    const r = await mergePageObjectFile(generatedPath, targetPath);
    return toOutcome(type, targetPath, r.action, r.oldContent, r.newContent, [
      ...r.addedMethods.map((m) => `+ method: ${m}`),
      ...r.skippedMethods.map((m) => `= method (already present): ${m}`)
    ]);
  }
  // locators
  const r = await mergeLocatorFile(generatedPath, targetPath);
  return toOutcome(type, targetPath, r.action, r.oldContent, r.newContent, [
    ...r.addedLocators.map((l) => `+ locator: ${l}`),
    ...r.skippedLocators.map((l) => `= locator (already present): ${l}`)
  ]);
}

function toOutcome(
  type: FileTypeKey,
  targetPath: string,
  action: "create" | "merge" | "noop",
  oldContent: string,
  newContent: string,
  details: string[]
): FileMergeOutcome {
  const mapped: FileMergeOutcome["action"] =
    action === "create" ? "created" : action === "merge" ? "merged" : "noop";
  return { type, action: mapped, targetPath, oldContent, newContent, details };
}

async function writePatchFile(
  repoRoot: string,
  cfg: QaEngineConfig,
  outcomes: FileMergeOutcome[]
): Promise<void> {
  const patchPath = path.join(repoRoot, cfg.generation.patchFile);
  await mkdir(path.dirname(patchPath), { recursive: true });

  const diffs: string[] = [];
  for (const outcome of outcomes) {
    if (outcome.oldContent === outcome.newContent) continue;
    const rel = path.relative(repoRoot, outcome.targetPath).split("\\").join("/");
    const diff = unifiedDiff(outcome.oldContent, outcome.newContent, rel, rel);
    if (diff) diffs.push(diff);
  }

  await writeFile(patchPath, diffs.join("\n"), "utf-8");
  console.log(`Patch written to ${path.relative(repoRoot, patchPath).split("\\").join("/")}`);
}

function printSummary(outcomes: FileMergeOutcome[], options: ApplyOptions): void {
  const counts = { created: 0, merged: 0, skipped: 0, overwritten: 0, noop: 0 };
  for (const o of outcomes) counts[o.action]++;

  const prefix = options.dryRun
    ? "[dry-run] would "
    : options.patch
      ? "[patch] "
      : "";

  console.log("");
  console.log(`${prefix}Apply summary:`);
  console.log(`  created:     ${counts.created}`);
  console.log(`  merged:      ${counts.merged}`);
  console.log(`  overwritten: ${counts.overwritten}`);
  console.log(`  no changes:  ${counts.noop}`);
  console.log(`  skipped:     ${counts.skipped}`);
  console.log("");

  for (const o of outcomes) {
    const rel = o.targetPath;
    console.log(`${labelFor(o.action, options)} ${o.type}: ${rel}`);
    for (const d of o.details) {
      console.log(`    ${d}`);
    }
  }
}

function labelFor(action: FileMergeOutcome["action"], options: ApplyOptions): string {
  const verbMap: Record<FileMergeOutcome["action"], string> = {
    created: "Create",
    merged: "Merge",
    overwritten: "Overwrite",
    noop: "No change",
    skipped: "Skip"
  };
  const verb = verbMap[action];
  if (options.dryRun) return `[would ${verb.toLowerCase()}]`;
  if (options.patch) return `[patch ${verb.toLowerCase()}]`;
  return `[${verb.toLowerCase()}]`;
}

async function getFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile()) files.push(fullPath);
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

async function dirExists(dir: string): Promise<boolean> {
  try {
    await access(dir, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
