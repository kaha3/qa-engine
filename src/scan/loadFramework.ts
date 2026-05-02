import path from "path";
import { readFile } from "fs/promises";
import { FrameworkModel } from "./types";

export async function loadFramework(repoRoot: string): Promise<FrameworkModel | undefined> {
  const filePath = path.join(repoRoot, ".qa-engine", "framework.json");
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as FrameworkModel;
  } catch {
    return undefined;
  }
}

export function findExistingStepText(
  framework: FrameworkModel | undefined,
  stepText: string
): boolean {
  if (!framework) return false;
  const normalized = normalizeStepText(stepText);
  return framework.steps.some((s) => normalizeStepText(stripQuotes(s.pattern)) === normalized);
}

export function findExistingPageObjectClass(
  framework: FrameworkModel | undefined,
  className: string
): { file: string; methods: string[] } | undefined {
  if (!framework) return undefined;
  const match = framework.pageObjects.find((p) => p.className === className);
  if (!match) return undefined;
  return {
    file: match.file,
    methods: match.methods.map((m) => m.name)
  };
}

export function findExistingLocatorNames(
  framework: FrameworkModel | undefined,
  fileSuffix: string
): Set<string> {
  if (!framework) return new Set();
  const names = framework.locators
    .filter((l) => l.file.endsWith(fileSuffix))
    .map((l) => l.exportName);
  return new Set(names);
}

function stripQuotes(s: string): string {
  const trimmed = s.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith("`") && trimmed.endsWith("`"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function normalizeStepText(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}
