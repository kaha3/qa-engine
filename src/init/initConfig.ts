import path from "path";
import { readFileSync } from "fs";
import readline from "readline";
import { access, constants, stat, writeFile } from "fs/promises";
import { QaEngineConfig, QaEngineConfigSchema } from "../config/schema";

type AskQuestion = (question: string) => Promise<string>;

type PathPrompt = {
  key: keyof QaEngineConfig["paths"] | "suiteRoot";
  label: string;
  defaultValue: string;
  kind: "directory" | "file";
  optional?: boolean;
};

const pathPrompts: PathPrompt[] = [
  {
    key: "suiteRoot",
    label: "Suite root",
    defaultValue: "e2e-tests",
    kind: "directory"
  },
  {
    key: "featuresDir",
    label: "Features directory",
    defaultValue: "e2e-tests/features",
    kind: "directory"
  },
  {
    key: "stepsDir",
    label: "Step-definitions directory",
    defaultValue: "e2e-tests/step-definitions",
    kind: "directory"
  },
  {
    key: "pageObjectsDir",
    label: "Pageobjects directory",
    defaultValue: "e2e-tests/pageobjects",
    kind: "directory"
  },
  {
    key: "supportDir",
    label: "Support directory",
    defaultValue: "e2e-tests/support",
    kind: "directory"
  },
  {
    key: "elementsDir",
    label: "Elements directory",
    defaultValue: "e2e-tests/support/elements",
    kind: "directory"
  },
  {
    key: "elementListFile",
    label: "Optional elementList file path",
    defaultValue: "e2e-tests/support/elementList.ts",
    kind: "file",
    optional: true
  }
];

export async function initConfig(repoRoot: string): Promise<void> {
  const promptSession = createPromptSession();

  try {
    console.log("Initialize qa-engine for this automation repo.");
    console.log(`Repo root: ${repoRoot}`);
    console.log("");

    const answers = new Map<string, string>();

    for (const prompt of pathPrompts) {
      const value = await askForExistingPath(promptSession.askQuestion, repoRoot, prompt);
      if (value !== undefined) {
        answers.set(prompt.key, value);
      }
    }

    const config = buildConfig(answers);
    QaEngineConfigSchema.parse(config);

    const configPath = path.join(repoRoot, "qa-engine.config.json");
    if (await exists(configPath)) {
      const overwrite = await promptSession.askQuestion(
        "qa-engine.config.json already exists. Overwrite? [y/N] "
      );
      if (!["y", "yes"].includes(overwrite.trim().toLowerCase())) {
        console.log("Init cancelled. Existing qa-engine.config.json was not changed.");
        return;
      }
    }

    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf-8");

    console.log("");
    console.log("qa-engine initialized successfully.");
    console.log("");
    console.log("Suggested next commands:");
    console.log("  qa-engine scan");
    console.log("  qa-engine generate-all --story story.txt");
    console.log("  qa-engine apply");
  } finally {
    promptSession.close();
  }
}

async function askForExistingPath(
  askQuestion: AskQuestion,
  repoRoot: string,
  prompt: PathPrompt
): Promise<string | undefined> {
  while (true) {
    const suffix = prompt.optional
      ? ` [${prompt.defaultValue}, enter "none" to skip]: `
      : ` [${prompt.defaultValue}]: `;
    const answer = await askQuestion(`${prompt.label}${suffix}`);
    const rawValue = answer.trim() || prompt.defaultValue;

    if (prompt.optional && rawValue.toLowerCase() === "none") {
      return undefined;
    }

    const normalized = normalizeRelativePath(rawValue);
    if (!normalized) {
      console.log("  Enter a relative path inside the current repo root.");
      continue;
    }

    const fullPath = path.resolve(repoRoot, normalized);
    if (!isInsideRepo(repoRoot, fullPath)) {
      console.log("  Enter a path inside the current repo root.");
      continue;
    }

    const valid = await validatePath(fullPath, prompt.kind);
    if (!valid) {
      const expected = prompt.kind === "directory" ? "directory" : "file";
      console.log(`  Path must exist and be a ${expected}: ${normalized}`);
      continue;
    }

    return normalized;
  }
}

function buildConfig(answers: Map<string, string>): QaEngineConfig {
  const paths: QaEngineConfig["paths"] = {
    featuresDir: requiredAnswer(answers, "featuresDir"),
    stepsDir: requiredAnswer(answers, "stepsDir"),
    pageObjectsDir: requiredAnswer(answers, "pageObjectsDir"),
    supportDir: requiredAnswer(answers, "supportDir"),
    elementsDir: requiredAnswer(answers, "elementsDir")
  };

  const elementListFile = answers.get("elementListFile");
  if (elementListFile) {
    paths.elementListFile = elementListFile;
  }

  return {
    stack: "wdio-cucumber-ts",
    suiteRoot: requiredAnswer(answers, "suiteRoot"),
    paths,
    naming: {
      pageObjectFileSuffix: "Page.ts",
      pageObjectClassSuffix: "PageObject",
      stepsFileSuffix: ".steps.ts"
    },
    generation: {
      outputDir: ".qa-engine/out",
      patchFile: ".qa-engine/out/patch.diff",
      qaPackageFile: ".qa-engine/out/qa-package.md",
      defaultTags: ["@p1"],
      preferPatch: true
    },
    routing: {
      domainKeywordToKey: {
        sdd: "sdd",
        "same day delivery": "sdd",
        shipping: "shipping",
        checkout: "shopping",
        cart: "shopping",
        pdp: "pdp",
        plp: "plp",
        "order history": "orderHistory",
        "split cart": "splitCart",
        "part predictor": "partPredictor",
        sns: "sns",
        register: "register",
        login: "login"
      }
    },
    locators: {
      mode: "multi-file",
      defaultFileKey: "common",
      fileForDomainKey: {
        sdd: "sdd.ts",
        shipping: "shipping.ts",
        shopping: "shopping.ts",
        pdp: "pdp.ts",
        plp: "plp.ts",
        orderHistory: "orderHistory.ts",
        splitCart: "splitCart.ts",
        partPredictor: "partPredictor.ts",
        sns: "sns.ts",
        register: "register.ts",
        login: "login.ts",
        common: "home.ts"
      }
    },
    llm: {
      provider: "openai",
      model: "gpt-4.1-mini",
      responseFormat: "json"
    }
  };
}

function createPromptSession(): { askQuestion: AskQuestion; close: () => void } {
  if (!process.stdin.isTTY) {
    const answers = readFileSync(0, "utf-8").split(/\r?\n/);

    return {
      askQuestion: async (question: string) => {
        process.stdout.write(question);
        return answers.shift() ?? "";
      },
      close: () => undefined
    };
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return {
    askQuestion: (question: string) => ask(rl, question),
    close: () => rl.close()
  };
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function normalizeRelativePath(input: string): string | undefined {
  if (path.isAbsolute(input)) {
    return undefined;
  }

  const normalized = path.normalize(input).replace(/\\/g, "/");
  if (normalized === ".." || normalized.startsWith("../")) {
    return undefined;
  }

  return normalized === "." ? "." : normalized.replace(/\/$/, "");
}

function isInsideRepo(repoRoot: string, fullPath: string): boolean {
  const relative = path.relative(repoRoot, fullPath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function validatePath(fullPath: string, kind: "directory" | "file"): Promise<boolean> {
  try {
    const info = await stat(fullPath);
    return kind === "directory" ? info.isDirectory() : info.isFile();
  } catch {
    return false;
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function requiredAnswer(answers: Map<string, string>, key: string): string {
  const value = answers.get(key);
  if (!value) {
    throw new Error(`Missing required init answer: ${key}`);
  }

  return value;
}
