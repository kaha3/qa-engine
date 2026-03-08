# qa-engine

Framework-aware QA automation generator for **WebdriverIO + Cucumber + TypeScript** projects.

`qa-engine` is an external local CLI tool that helps QA engineers turn a Jira-style user story into a starter automation package. It can scan an existing automation framework, generate preview artifacts, and apply them into the framework with merge-aware behavior.

## Current status

Early working prototype.

What works today:

- scan an existing WDIO+Cucumber+TS repo
- generate a QA package from a story text file
- generate preview artifacts:
  - feature file
  - step definitions
  - page object
  - locator file
- apply generated files into a framework
- merge safely for:
  - feature scenarios
  - step definitions
  - locator exports
  - page object methods

## Supported stack

Current Phase 1 target:

- WebdriverIO
- Cucumber
- TypeScript

## Project structure

This tool is meant to live in its **own repo** and run against another automation repo.

Example:

```text
D:/projects/
  qa-engine/         <-- this tool
  qa-engine-demo/    <-- demo WDIO framework
```

## How it works

High-level flow:

1. Scan the framework
2. Read a Jira-style story text file
3. Generate preview output into `.qa-engine/out/`
4. Review generated files
5. Apply them into the target framework

## Commands

### Scan the target framework

Run this from the automation repo root:

```bash
npx ts-node ..\qa-engine\src\cli.ts scan
```

This creates:

```text
.qa-engine/framework.json
```

### Generate QA package only

```bash
npx ts-node ..\qa-engine\src\cli.ts generate --story story.txt
```

This creates:

- `.qa-engine/out/qa-package.json`
- `.qa-engine/out/qa-package.md`

### Generate all preview artifacts

```bash
npx ts-node ..\qa-engine\src\cli.ts generate-all --story story.txt
```

This creates preview files inside:

```text
.qa-engine/out/
  features/
  step-definitions/
  pageobjects/
  elements/
```

### Apply generated files into framework

```bash
npx ts-node ..\qa-engine\src\cli.ts apply
```

## Apply behavior

Current apply behavior:

- **feature files**
  - merge scenarios
  - skip duplicate scenarios
- **step definition files**
  - merge missing step definitions
  - skip duplicates
- **locator files**
  - merge missing exported locators
  - skip duplicates
- **page object files**
  - merge missing methods
  - skip existing methods

## Configuration

Each target automation repo needs a `qa-engine.config.json` file in its root.

Example:

```json
{
  "stack": "wdio-cucumber-ts",
  "suiteRoot": "e2e-tests",
  "paths": {
    "featuresDir": "e2e-tests/features",
    "stepsDir": "e2e-tests/step-definitions",
    "pageObjectsDir": "e2e-tests/pageobjects",
    "supportDir": "e2e-tests/support",
    "elementsDir": "e2e-tests/support/elements",
    "elementListFile": "e2e-tests/support/elementList.ts"
  },
  "naming": {
    "pageObjectFileSuffix": "Page.ts",
    "pageObjectClassSuffix": "PageObject",
    "stepsFileSuffix": ".steps.ts"
  },
  "generation": {
    "outputDir": ".qa-engine/out",
    "patchFile": ".qa-engine/out/patch.diff",
    "qaPackageFile": ".qa-engine/out/qa-package.md",
    "defaultTags": ["@p1"],
    "preferPatch": true
  },
  "routing": {
    "domainKeywordToKey": {
      "sdd": "sdd",
      "same day delivery": "sdd",
      "shipping": "shipping",
      "checkout": "shopping",
      "cart": "shopping",
      "pdp": "pdp",
      "plp": "plp",
      "order history": "orderHistory",
      "split cart": "splitCart",
      "part predictor": "partPredictor",
      "sns": "sns",
      "register": "register",
      "login": "login"
    }
  },
  "locators": {
    "mode": "multi-file",
    "defaultFileKey": "common",
    "fileForDomainKey": {
      "sdd": "sdd.ts",
      "shipping": "shipping.ts",
      "shopping": "shopping.ts",
      "pdp": "pdp.ts",
      "plp": "plp.ts",
      "orderHistory": "orderHistory.ts",
      "splitCart": "splitCart.ts",
      "partPredictor": "partPredictor.ts",
      "sns": "sns.ts",
      "register": "register.ts",
      "login": "login.ts",
      "common": "home.ts"
    }
  },
  "llm": {
    "provider": "openai",
    "model": "gpt-4.1-mini",
    "responseFormat": "json"
  }
}
```

## Demo usage

Example story file:

```text
Story: Same Day Delivery

Acceptance Criteria:
- User should see Same Day Delivery when product and ZIP code are eligible.
- User should not see Same Day Delivery when ZIP code is not eligible.
- Shipping total should update after selecting Same Day Delivery.
- This should apply only for supported products.
```

Example flow:

```bash
npx ts-node ..\qa-engine\src\cli.ts scan
npx ts-node ..\qa-engine\src\cli.ts generate-all --story story.txt
npx ts-node ..\qa-engine\src\cli.ts apply
```

## What the prototype already generates

For the current demo flow, `qa-engine` can generate:

- QA package
- `.feature` file
- `.steps.ts` file
- `Page.ts` page object file
- locator `.ts` file

## Limitations right now

This is still an early prototype. Current limitations include:

- domain logic is still partly rule-based / hardcoded
- no real LLM provider wired in yet
- no `init` command yet
- no patch/diff apply flow yet
- page object merge currently merges methods only
- page object getter/import/class-level merge is still basic
- generated automation is starter-level, not production-ready without review

## Recommended next steps

Planned next improvements:

- `qa-engine init`
- real model-agnostic LLM adapter
- better formatting cleanup
- smarter reuse from `framework.json`
- safer patch mode / diff mode
- better domain plug-in architecture
- support for more flows beyond the demo domain

## Why this project exists

The goal is to reduce sprint pressure for QA automation teams by helping them:

- generate automation structure faster
- keep framework consistency
- reduce repetitive boilerplate work
- safely merge new automation artifacts into existing frameworks

## License

Prototype stage. Choose a license before public release.
