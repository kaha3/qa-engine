import { z } from "zod";

export const QaPackageResponseSchema = z.object({
  domainKey: z.string().min(1),
  automationScenarios: z.array(z.string().min(1)),
  manualChecks: z.array(z.string()),
  impactedAreas: z.array(z.string()),
  clarificationQuestions: z.array(z.string())
});

export type QaPackageResponse = z.infer<typeof QaPackageResponseSchema>;
