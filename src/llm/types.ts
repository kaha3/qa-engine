export type GenerationMode = "automation" | "full";

export type QaPackageInput = {
  storyText: string;
  mode: GenerationMode;
  routing: Record<string, string>;
};

export type QaPackageResult = {
  domainKey: string;
  automationScenarios: string[];
  manualChecks: string[];
  impactedAreas: string[];
  clarificationQuestions: string[];
};

export interface LlmClient {
  readonly providerName: string;
  generateQaPackage(input: QaPackageInput): Promise<QaPackageResult>;
}

export class LlmError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "LlmError";
  }
}
