import { readFile, writeFile } from "fs/promises";

function extractMethodNames(content: string): Set<string> {
  const regex = /public async ([a-zA-Z0-9_]+)\s*\(/g;
  const names = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = regex.exec(content))) {
    names.add(match[1].trim());
  }

  return names;
}

function extractMethodBlocks(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const blocks: string[] = [];

  let currentBlock: string[] = [];
  let insideMethod = false;
  let braceDepth = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const isMethodStart = /^public async [a-zA-Z0-9_]+\s*\(/.test(trimmed);

    if (isMethodStart) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n").trimEnd());
      }
      currentBlock = [line];
      insideMethod = true;

      braceDepth = (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length;
      continue;
    }

    if (insideMethod) {
      currentBlock.push(line);
      braceDepth += (line.match(/{/g) ?? []).length;
      braceDepth -= (line.match(/}/g) ?? []).length;

      if (braceDepth <= 0) {
        blocks.push(currentBlock.join("\n").trimEnd());
        currentBlock = [];
        insideMethod = false;
        braceDepth = 0;
      }
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join("\n").trimEnd());
  }

  return blocks.filter(Boolean);
}

function extractMethodNameFromBlock(block: string): string {
  const firstLine = block.split(/\r?\n/)[0] ?? "";
  const match = firstLine.trim().match(/^public async ([a-zA-Z0-9_]+)\s*\(/);
  return match?.[1]?.trim() ?? "";
}

export async function mergePageObjectFile(
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
      addedMethods: [],
      skippedMethods: []
    };
  }

  const existingMethodNames = extractMethodNames(targetContent);
  const generatedMethodBlocks = extractMethodBlocks(generatedContent);

  const addedMethods: string[] = [];
  const skippedMethods: string[] = [];
  const methodsToAppend: string[] = [];

  for (const block of generatedMethodBlocks) {
    const methodName = extractMethodNameFromBlock(block);
    if (!methodName) continue;

    if (existingMethodNames.has(methodName)) {
      skippedMethods.push(methodName);
    } else {
      addedMethods.push(methodName);
      methodsToAppend.push(block);
    }
  }

  if (methodsToAppend.length === 0) {
    return {
      created: false,
      addedMethods,
      skippedMethods
    };
  }

  const classCloseIndex = targetContent.lastIndexOf("}");
  if (classCloseIndex === -1) {
    throw new Error(`Could not find closing brace in page object file: ${targetFilePath}`);
  }

  const beforeClose = targetContent.slice(0, classCloseIndex).trimEnd();
  const afterClose = targetContent.slice(classCloseIndex);

  const mergedContent =
    `${beforeClose}\n\n${methodsToAppend.join("\n\n")}\n\n${afterClose}`.trimEnd() + "\n";

  await writeFile(targetFilePath, mergedContent, "utf-8");

  return {
    created: false,
    addedMethods,
    skippedMethods
  };
}