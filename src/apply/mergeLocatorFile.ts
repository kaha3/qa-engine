import { readFile, writeFile } from "fs/promises";

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
    if (/^export const [A-Z0-9_]+\s*=/.test(line.trim())) {
      break;
    }
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
) {
  const generatedContent = await readFile(generatedFilePath, "utf-8");

  let targetContent = "";
  try {
    targetContent = await readFile(targetFilePath, "utf-8");
  } catch {
    await writeFile(targetFilePath, generatedContent, "utf-8");
    return {
      created: true,
      addedLocators: [],
      skippedLocators: []
    };
  }

  const existingLocatorNames = extractLocatorNames(targetContent);
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
      created: false,
      addedLocators,
      skippedLocators
    };
  }

  const header = extractHeader(targetContent);
  const existingBlocks = extractLocatorBlocks(targetContent);

  const mergedContent =
    [header, "", ...existingBlocks, ...blocksToAppend].join("\n\n").trim() + "\n";

  await writeFile(targetFilePath, mergedContent, "utf-8");

  return {
    created: false,
    addedLocators,
    skippedLocators
  };
}