import { readFile, writeFile } from "fs/promises";

function extractStepTexts(content: string): Set<string> {
  const regex = /(?:Given|When|Then|And)\("([^"]+)"/g;
  const texts = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = regex.exec(content))) {
    texts.add(match[1].trim());
  }

  return texts;
}

function extractStepBlocks(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const blocks: string[] = [];

  let currentBlock: string[] = [];
  let insideBlock = false;

  for (const line of lines) {
    const isStepStart = /^(Given|When|Then|And)\("([^"]+)"/.test(line);

    if (isStepStart) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n").trim());
      }
      currentBlock = [line];
      insideBlock = true;
      continue;
    }

    if (insideBlock) {
      currentBlock.push(line);

      if (line.trim() === "});") {
        blocks.push(currentBlock.join("\n").trim());
        currentBlock = [];
        insideBlock = false;
      }
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join("\n").trim());
  }

  return blocks.filter(Boolean);
}

function extractImportsAndSetup(content: string): string {
  const lines = content.split(/\r?\n/);
  const header: string[] = [];

  for (const line of lines) {
    if (/^(Given|When|Then|And)\("([^"]+)"/.test(line)) {
      break;
    }
    header.push(line);
  }

  return header.join("\n").trim();
}

function extractStepTextFromBlock(block: string): string {
  const firstLine = block.split(/\r?\n/)[0] ?? "";
  const match = firstLine.match(/^(Given|When|Then|And)\("([^"]+)"/);
  return match?.[2]?.trim() ?? "";
}

export async function mergeStepFile(
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
      addedSteps: [],
      skippedSteps: []
    };
  }

  const existingStepTexts = extractStepTexts(targetContent);
  const generatedBlocks = extractStepBlocks(generatedContent);

  const addedSteps: string[] = [];
  const skippedSteps: string[] = [];
  const blocksToAppend: string[] = [];

  for (const block of generatedBlocks) {
    const stepText = extractStepTextFromBlock(block);
    if (!stepText) continue;

    if (existingStepTexts.has(stepText)) {
      skippedSteps.push(stepText);
    } else {
      addedSteps.push(stepText);
      blocksToAppend.push(block);
    }
  }

  if (blocksToAppend.length === 0) {
    return {
      created: false,
      addedSteps,
      skippedSteps
    };
  }

  const header = extractImportsAndSetup(targetContent);
  const existingBlocks = extractStepBlocks(targetContent);

  const mergedContent =
    [header, "", ...existingBlocks, ...blocksToAppend].join("\n\n").trim() + "\n";

  await writeFile(targetFilePath, mergedContent, "utf-8");

  return {
    created: false,
    addedSteps,
    skippedSteps
  };
}