import { z } from "zod";

export const QaEngineConfigSchema = z.object({
  stack: z.literal("wdio-cucumber-ts"),
  suiteRoot: z.string(),

  paths: z.object({
    featuresDir: z.string(),
    stepsDir: z.string(),
    pageObjectsDir: z.string(),
    supportDir: z.string(),
    elementsDir: z.string(),
    elementListFile: z.string().optional()
  }),

  naming: z.object({
    pageObjectFileSuffix: z.string(),   // "Page.ts"
    pageObjectClassSuffix: z.string(),  // "PageObject"
    stepsFileSuffix: z.string()         // ".steps.ts"
  }),

  generation: z.object({
    outputDir: z.string(),
    patchFile: z.string(),
    qaPackageFile: z.string(),
    defaultTags: z.array(z.string()),
    preferPatch: z.boolean()
  }),

  routing: z.object({
    domainKeywordToKey: z.record(z.string(), z.string())
  }),

  locators: z.object({
    mode: z.literal("multi-file"),
    defaultFileKey: z.string(),
    fileForDomainKey: z.record(z.string(), z.string())
  }),

  llm: z.object({
    provider: z.string(),
    model: z.string(),
    responseFormat: z.literal("json")
  })
});

export type QaEngineConfig = z.infer<typeof QaEngineConfigSchema>;