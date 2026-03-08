import { LlmClient } from "./types";
import { getDomainSpec } from "../domains/domainSpecs";

export class FakeLlmClient implements LlmClient {
  async generateQaPackage(input: { storyText: string }) {
    const text = input.storyText.toLowerCase();

    let domainKey = "general";
    if (text.includes("login")) domainKey = "login";
    if (text.includes("cart")) domainKey = "shopping";
    if (text.includes("checkout")) domainKey = "shopping";
    if (text.includes("shipping")) domainKey = "shipping";
    if (text.includes("same day")) domainKey = "sdd";
    if (text.includes("split cart")) domainKey = "splitCart";
    if (text.includes("order history")) domainKey = "orderHistory";
    if (text.includes("part predictor")) domainKey = "partPredictor";

    const spec = getDomainSpec(domainKey);

    if (spec) {
      return {
        domainKey,
        automationScenarios: spec.automationScenarios,
        manualChecks: spec.manualChecks,
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
      manualChecks: [
        "Verify visual behavior manually",
        "Verify calculation or displayed values manually"
      ],
      impactedAreas: [
        "UI flow",
        "Related page object",
        "Related locators"
      ],
      clarificationQuestions: [
        "Should this work for guest users, registered users, or both?",
        "Are there country, payment, or shipping restrictions?",
        "Are there edge cases that must stay manual only?"
      ]
    };
  }
}