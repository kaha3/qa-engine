import { LlmClient, QaPackageInput, QaPackageResult } from "./types";
import { detectDomainKey, getDomainSpec } from "../domains/domainSpecs";

export class FakeLlmClient implements LlmClient {
  readonly providerName = "fake";

  async generateQaPackage(input: QaPackageInput): Promise<QaPackageResult> {
    const domainKey = detectDomainKey(input.storyText, input.routing);
    const spec = getDomainSpec(domainKey);

    const includeManual = input.mode === "full";

    if (spec) {
      return {
        domainKey,
        automationScenarios: spec.scenarios.map((s) => s.title),
        manualChecks: includeManual ? spec.manualChecks : [],
        impactedAreas: spec.impactedAreas,
        clarificationQuestions: spec.clarificationQuestions
      };
    }

    return {
      domainKey,
      automationScenarios: [
        "Happy path scenario",
        "Basic negative scenario",
        "Validation scenario"
      ],
      manualChecks: includeManual
        ? [
            "Verify visual behavior manually",
            "Verify calculation or displayed values manually"
          ]
        : [],
      impactedAreas: ["UI flow", "Related page object", "Related locators"],
      clarificationQuestions: [
        "Should this work for guest users, registered users, or both?",
        "Are there country, payment, or shipping restrictions?",
        "Are there edge cases that must stay manual only?"
      ]
    };
  }
}
