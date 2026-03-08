export interface LlmClient {
  generateQaPackage(input: {
    storyText: string;
  }): Promise<{
    domainKey: string;
    automationScenarios: string[];
    manualChecks: string[];
    impactedAreas: string[];
    clarificationQuestions: string[];
  }>;
}