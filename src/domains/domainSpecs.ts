export type DomainStep = {
  keyword: "Given" | "When" | "Then";
  text: string;
  method: string;
};

export type DomainSpec = {
  featureTitle: string;
  automationScenarios: string[];
  manualChecks: string[];
  impactedAreas: string[];
  clarificationQuestions: string[];
  steps: DomainStep[];
  locators: string[];
  getters: Array<{ name: string; locator: string }>;
  methods: string[];
};

export const domainSpecs: Record<string, DomainSpec> = {
  sdd: {
    featureTitle: "Same Day Delivery",
    automationScenarios: [
      "User sees Same Day Delivery for eligible ZIP and supported product",
      "User does not see Same Day Delivery for non-eligible ZIP",
      "Shipping total updates after selecting Same Day Delivery"
    ],
    manualChecks: [
      "Verify displayed Same Day Delivery label and formatting",
      "Verify final shipping total and rounding visually",
      "Verify unsupported products do not show Same Day Delivery unexpectedly"
    ],
    impactedAreas: [
      "PDP",
      "Shipping selection",
      "ZIP code validation",
      "Order total calculation"
    ],
    clarificationQuestions: [
      "What ZIP codes should be treated as eligible and non-eligible in test data?",
      "What products are considered supported for Same Day Delivery?",
      "Should Same Day Delivery appear on PDP, cart, checkout, or all of them?"
    ],
    steps: [
      {
        keyword: "Given",
        text: "the user is on the homepage",
        method: "openHomePage"
      },
      {
        keyword: "When",
        text: "the user opens a supported product",
        method: "openSupportedProduct"
      },
      {
        keyword: "When",
        text: "the user enters an eligible ZIP code",
        method: "enterEligibleZipCode"
      },
      {
        keyword: "Then",
        text: "the user should see Same Day Delivery option",
        method: "verifySameDayDeliveryVisible"
      },
      {
        keyword: "When",
        text: "the user enters a non-eligible ZIP code",
        method: "enterNonEligibleZipCode"
      },
      {
        keyword: "Then",
        text: "the user should not see Same Day Delivery option",
        method: "verifySameDayDeliveryNotVisible"
      },
      {
        keyword: "When",
        text: "the user selects Same Day Delivery",
        method: "selectSameDayDelivery"
      },
      {
        keyword: "Then",
        text: "the shipping total should be updated",
        method: "verifyShippingTotalUpdated"
      }
    ],
    locators: [
      "SUPPORTED_PRODUCT_LINK",
      "ELIGIBLE_ZIP_INPUT",
      "NON_ELIGIBLE_ZIP_INPUT",
      "SAME_DAY_DELIVERY_OPTION",
      "SHIPPING_TOTAL_LABEL"
    ],
    getters: [
      { name: "supportedProductLink", locator: "SUPPORTED_PRODUCT_LINK" },
      { name: "eligibleZipInput", locator: "ELIGIBLE_ZIP_INPUT" },
      { name: "nonEligibleZipInput", locator: "NON_ELIGIBLE_ZIP_INPUT" },
      { name: "sameDayDeliveryOption", locator: "SAME_DAY_DELIVERY_OPTION" },
      { name: "shippingTotalLabel", locator: "SHIPPING_TOTAL_LABEL" }
    ],
    methods: [
      "openHomePage",
      "openSupportedProduct",
      "enterEligibleZipCode",
      "enterNonEligibleZipCode",
      "verifySameDayDeliveryVisible",
      "verifySameDayDeliveryNotVisible",
      "selectSameDayDelivery",
      "verifyShippingTotalUpdated"
    ]
  }
};

export function getDomainSpec(domainKey: string): DomainSpec | undefined {
  return domainSpecs[domainKey];
}