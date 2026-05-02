import { readFile } from "fs/promises";
import { formatTypeScriptFile } from "../utils/formatFile";

export type LocatorMergeResult = {
  action: "create" | "merge" | "noop";
  oldContent: string;
  newContent: string;
  addedLocators: string[];
  skippedLocators: string[];
};

function extractLocatorNames(content: string): Set<string> {
  const regex = /export const ([A-Z0-9_]+)\s*=/g;
  const names = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content))) {
    names.add(match[1].trim());
  }
  return names;
}

function extractLocatorBlocks(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const blocks: string[] = [];
  for (const line of lines) {
    if (/^export const [A-Z0-9_]+\s*=/.test(line.trim())) {
      blocks.push(line.trim());
    }
  }
  return blocks;
}

function extractHeader(content: string): string {
  const lines = content.split(/\r?\n/);
  const header: string[] = [];
  for (const line of lines) {
    if (/^export const [A-Z0-9_]+\s*=/.test(line.trim())) break;
    header.push(line);
  }
  return header.join("\n").trim();
}

function extractLocatorNameFromBlock(block: string): string {
  const match = block.match(/^export const ([A-Z0-9_]+)\s*=/);
  return match?.[1]?.trim() ?? "";
}

export async function mergeLocatorFile(
  generatedFilePath: string,
  targetFilePath: string
): Promise<LocatorMergeResult> {
  const generatedContent = await readFile(generatedFilePath, "utf-8");

  let oldContent = "";
  try {
    oldContent = await readFile(targetFilePath, "utf-8");
  } catch {
    return {
      action: "create",
      oldContent: "",
      newContent: formatTypeScriptFile(generatedContent),
      addedLocators: extractLocatorBlocks(generatedContent).map(extractLocatorNameFromBlock).filter(Boolean),
      skippedLocators: []
    };
  }

  const existingLocatorNames = extractLocatorNames(oldContent);
  const generatedBlocks = extractLocatorBlocks(generatedContent);

  const addedLocators: string[] = [];
  const skippedLocators: string[] = [];
  const blocksToAppend: string[] = [];

  for (const block of generatedBlocks) {
    const locatorName = extractLocatorNameFromBlock(block);
    if (!locatorName) continue;
    if (existingLocatorNames.has(locatorName)) {
      skippedLocators.push(locatorName);
    } else {
      addedLocators.push(locatorName);
      blocksToAppend.push(block);
    }
  }

  if (blocksToAppend.length === 0) {
    return {
      action: "noop",
      oldContent,
      newContent: oldContent,
      addedLocators,
      skippedLocators
    };
  }

  const header = extractHeader(oldContent);
  const existingBlocks = extractLocatorBlocks(oldContent);
  const merged = [header, "", ...existingBlocks, ...blocksToAppend].join("\n\n");

  return {
    action: "merge",
    oldContent,
    newContent: formatTypeScriptFile(merged),
    addedLocators,
    skippedLocators
  };
}
