import { readFile, writeFile } from "fs/promises";

function extractScenarioTitles(content: string): Set<string> {
  const matches = content.match(/^Scenario:\s+(.+)$/gm) ?? [];
  const titles = matches.map((line) => line.replace(/^Scenario:\s+/, "").trim());
  return new Set(titles);
}

function extractScenarioBlocks(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const blocks: string[] = [];
  let currentBlock: string[] = [];

  for (const line of lines) {
    if (line.startsWith("Scenario: ")) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n").trim());
      }
      currentBlock = [line];
    } else {
      if (currentBlock.length > 0) {
        currentBlock.push(line);
      }
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join("\n").trim());
  }

  return blocks.filter(Boolean);
}

function extractFeatureHeader(content: string): string {
  const lines = content.split(/\r?\n/);
  const header: string[] = [];

  for (const line of lines) {
    if (line.startsWith("Scenario: ")) {
      break;
    }
    header.push(line);
  }

  return header.join("\n").trim();
}

export async function mergeFeatureFile(
  generatedFilePath: string,
  targetFilePath: string
) {
  const generatedContent = await readFile(generatedFilePath, "utf-8");

  let targetContent = "";
  try {
    targetContent = await readFile(targetFilePath, "utf-8");
  } catch {
    // target does not exist yet
    await writeFile(targetFilePath, generatedContent, "utf-8");
    return {
      created: true,
      addedScenarios: [],
      skippedScenarios: []
    };
  }

  const existingTitles = extractScenarioTitles(targetContent);
  const generatedBlocks = extractScenarioBlocks(generatedContent);

  const addedScenarios: string[] = [];
  const skippedScenarios: string[] = [];

  const blocksToAppend: string[] = [];

  for (const block of generatedBlocks) {
    const firstLine = block.split(/\r?\n/)[0] ?? "";
    const title = firstLine.replace(/^Scenario:\s+/, "").trim();

    if (!title) continue;

    if (existingTitles.has(title)) {
      skippedScenarios.push(title);
    } else {
      addedScenarios.push(title);
      blocksToAppend.push(block);
    }
  }

  if (blocksToAppend.length === 0) {
    return {
      created: false,
      addedScenarios,
      skippedScenarios
    };
  }

  const header = extractFeatureHeader(targetContent);
  const existingScenarioBlocks = extractScenarioBlocks(targetContent);

  const mergedContent = [
    header,
    "",
    ...existingScenarioBlocks,
    ...blocksToAppend
  ]
    .join("\n\n")
    .trim() + "\n";

  await writeFile(targetFilePath, mergedContent, "utf-8");

  return {
    created: false,
    addedScenarios,
    skippedScenarios
  };
}