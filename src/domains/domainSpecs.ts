export type DomainStep = {
  keyword: "Given" | "When" | "Then";
  text: string;
  method: string;
};

export type DomainGetter = {
  name: string;
  locator: string;
};

export type DomainMethod = {
  name: string;
  body: string[];
};

export type DomainScenario = {
  title: string;
  steps: string[];
};

export type DomainSpec = {
  featureTitle: string;
  scenarios: DomainScenario[];
  manualChecks: string[];
  impactedAreas: string[];
  clarificationQuestions: string[];
  steps: DomainStep[];
  locators: string[];
  getters: DomainGetter[];
  methods: DomainMethod[];
};

const sddSpec: DomainSpec = {
  featureTitle: "Same Day Delivery",
  scenarios: [
    {
      title: "User sees Same Day Delivery for eligible ZIP and supported product",
      steps: [
        "Given the user is on the homepage",
        "When the user opens a supported product",
        "And the user enters an eligible ZIP code",
        "Then the user should see Same Day Delivery option"
      ]
    },
    {
      title: "User does not see Same Day Delivery for non-eligible ZIP",
      steps: [
        "Given the user is on the homepage",
        "When the user opens a supported product",
        "And the user enters a non-eligible ZIP code",
        "Then the user should not see Same Day Delivery option"
      ]
    },
    {
      title: "Shipping total updates after selecting Same Day Delivery",
      steps: [
        "Given the user is on the homepage",
        "When the user opens a supported product",
        "And the user enters an eligible ZIP code",
        "And the user selects Same Day Delivery",
        "Then the shipping total should be updated"
      ]
    }
  ],
  manualChecks: [
    "Verify displayed Same Day Delivery label and formatting",
    "Verify final shipping total and rounding visually",
    "Verify unsupported products do not show Same Day Delivery unexpectedly"
  ],
  impactedAreas: ["PDP", "Shipping selection", "ZIP code validation", "Order total calculation"],
  clarificationQuestions: [
    "What ZIP codes should be treated as eligible and non-eligible in test data?",
    "What products are considered supported for Same Day Delivery?",
    "Should Same Day Delivery appear on PDP, cart, checkout, or all of them?"
  ],
  steps: [
    { keyword: "Given", text: "the user is on the homepage", method: "openHomePage" },
    { keyword: "When", text: "the user opens a supported product", method: "openSupportedProduct" },
    { keyword: "When", text: "the user enters an eligible ZIP code", method: "enterEligibleZipCode" },
    { keyword: "Then", text: "the user should see Same Day Delivery option", method: "verifySameDayDeliveryVisible" },
    { keyword: "When", text: "the user enters a non-eligible ZIP code", method: "enterNonEligibleZipCode" },
    { keyword: "Then", text: "the user should not see Same Day Delivery option", method: "verifySameDayDeliveryNotVisible" },
    { keyword: "When", text: "the user selects Same Day Delivery", method: "selectSameDayDelivery" },
    { keyword: "Then", text: "the shipping total should be updated", method: "verifyShippingTotalUpdated" }
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
    { name: "openHomePage", body: [`// TODO: replace with real URL`, `await browser.url("/");`] },
    {
      name: "openSupportedProduct",
      body: [
        `await this.supportedProductLink.waitForDisplayed({ timeout: 10000 });`,
        `await this.supportedProductLink.click();`
      ]
    },
    {
      name: "enterEligibleZipCode",
      body: [
        `// TODO: replace with eligible ZIP from test data`,
        `await this.eligibleZipInput.waitForDisplayed({ timeout: 10000 });`,
        `await this.eligibleZipInput.setValue("60601");`
      ]
    },
    {
      name: "enterNonEligibleZipCode",
      body: [
        `// TODO: replace with non-eligible ZIP from test data`,
        `await this.nonEligibleZipInput.waitForDisplayed({ timeout: 10000 });`,
        `await this.nonEligibleZipInput.setValue("99999");`
      ]
    },
    {
      name: "verifySameDayDeliveryVisible",
      body: [`await this.sameDayDeliveryOption.waitForDisplayed({ timeout: 10000 });`]
    },
    {
      name: "verifySameDayDeliveryNotVisible",
      body: [
        `await this.sameDayDeliveryOption.waitForDisplayed({ reverse: true, timeout: 10000 });`
      ]
    },
    {
      name: "selectSameDayDelivery",
      body: [
        `await this.sameDayDeliveryOption.waitForDisplayed({ timeout: 10000 });`,
        `await this.sameDayDeliveryOption.click();`
      ]
    },
    {
      name: "verifyShippingTotalUpdated",
      body: [
        `await this.shippingTotalLabel.waitForDisplayed({ timeout: 10000 });`,
        `// TODO: assert updated shipping total against expected value`
      ]
    }
  ]
};

const loginSpec: DomainSpec = {
  featureTitle: "Login",
  scenarios: [
    {
      title: "Registered user logs in with valid credentials",
      steps: [
        "Given the user is on the login page",
        "When the user submits valid credentials",
        "Then the user should be logged in"
      ]
    },
    {
      title: "Login fails with invalid credentials",
      steps: [
        "Given the user is on the login page",
        "When the user submits invalid credentials",
        "Then the user should see a login error message"
      ]
    }
  ],
  manualChecks: [
    "Verify error message wording and styling",
    "Verify redirect target after successful login"
  ],
  impactedAreas: ["Login page", "Session handling", "Header user state"],
  clarificationQuestions: [
    "Where should the user land after a successful login?",
    "What is the exact error copy for invalid credentials?",
    "Should the form lock after N failed attempts?"
  ],
  steps: [
    { keyword: "Given", text: "the user is on the login page", method: "openLoginPage" },
    { keyword: "When", text: "the user submits valid credentials", method: "submitValidCredentials" },
    { keyword: "When", text: "the user submits invalid credentials", method: "submitInvalidCredentials" },
    { keyword: "Then", text: "the user should be logged in", method: "verifyLoggedIn" },
    { keyword: "Then", text: "the user should see a login error message", method: "verifyLoginError" }
  ],
  locators: [
    "EMAIL_INPUT",
    "PASSWORD_INPUT",
    "LOGIN_SUBMIT_BUTTON",
    "LOGIN_ERROR_MESSAGE",
    "ACCOUNT_MENU"
  ],
  getters: [
    { name: "emailInput", locator: "EMAIL_INPUT" },
    { name: "passwordInput", locator: "PASSWORD_INPUT" },
    { name: "loginSubmitButton", locator: "LOGIN_SUBMIT_BUTTON" },
    { name: "loginErrorMessage", locator: "LOGIN_ERROR_MESSAGE" },
    { name: "accountMenu", locator: "ACCOUNT_MENU" }
  ],
  methods: [
    { name: "openLoginPage", body: [`await browser.url("/login");`] },
    {
      name: "submitValidCredentials",
      body: [
        `// TODO: pull credentials from test data, not hardcoded`,
        `await this.emailInput.waitForDisplayed({ timeout: 10000 });`,
        `await this.emailInput.setValue("user@example.com");`,
        `await this.passwordInput.setValue("CorrectPassword!");`,
        `await this.loginSubmitButton.click();`
      ]
    },
    {
      name: "submitInvalidCredentials",
      body: [
        `await this.emailInput.waitForDisplayed({ timeout: 10000 });`,
        `await this.emailInput.setValue("user@example.com");`,
        `await this.passwordInput.setValue("WrongPassword");`,
        `await this.loginSubmitButton.click();`
      ]
    },
    {
      name: "verifyLoggedIn",
      body: [`await this.accountMenu.waitForDisplayed({ timeout: 10000 });`]
    },
    {
      name: "verifyLoginError",
      body: [`await this.loginErrorMessage.waitForDisplayed({ timeout: 10000 });`]
    }
  ]
};

const shoppingSpec: DomainSpec = {
  featureTitle: "Shopping Cart",
  scenarios: [
    {
      title: "User adds an item to the cart",
      steps: [
        "Given the user is on a product page",
        "When the user adds the product to the cart",
        "Then the cart count should increase by one"
      ]
    },
    {
      title: "User removes an item from the cart",
      steps: [
        "Given the user has an item in the cart",
        "When the user removes the item from the cart",
        "Then the cart should be empty"
      ]
    }
  ],
  manualChecks: [
    "Verify mini-cart preview animation",
    "Verify cart totals across currencies",
    "Verify abandoned cart state across sessions"
  ],
  impactedAreas: ["PDP", "Mini-cart", "Cart page", "Header cart count"],
  clarificationQuestions: [
    "Should the cart persist across sessions for guests?",
    "What is the maximum quantity per line item?",
    "Are out-of-stock products allowed to be added?"
  ],
  steps: [
    { keyword: "Given", text: "the user is on a product page", method: "openProductPage" },
    { keyword: "Given", text: "the user has an item in the cart", method: "seedCartWithItem" },
    { keyword: "When", text: "the user adds the product to the cart", method: "addProductToCart" },
    { keyword: "When", text: "the user removes the item from the cart", method: "removeItemFromCart" },
    { keyword: "Then", text: "the cart count should increase by one", method: "verifyCartCountIncreasedByOne" },
    { keyword: "Then", text: "the cart should be empty", method: "verifyCartEmpty" }
  ],
  locators: [
    "ADD_TO_CART_BUTTON",
    "REMOVE_FROM_CART_BUTTON",
    "CART_COUNT_BADGE",
    "CART_EMPTY_STATE",
    "CART_LINE_ITEM"
  ],
  getters: [
    { name: "addToCartButton", locator: "ADD_TO_CART_BUTTON" },
    { name: "removeFromCartButton", locator: "REMOVE_FROM_CART_BUTTON" },
    { name: "cartCountBadge", locator: "CART_COUNT_BADGE" },
    { name: "cartEmptyState", locator: "CART_EMPTY_STATE" },
    { name: "cartLineItem", locator: "CART_LINE_ITEM" }
  ],
  methods: [
    {
      name: "openProductPage",
      body: [
        `// TODO: replace with real product URL`,
        `await browser.url("/product/sample");`
      ]
    },
    {
      name: "seedCartWithItem",
      body: [
        `await this.openProductPage();`,
        `await this.addProductToCart();`
      ]
    },
    {
      name: "addProductToCart",
      body: [
        `await this.addToCartButton.waitForClickable({ timeout: 10000 });`,
        `await this.addToCartButton.click();`
      ]
    },
    {
      name: "removeItemFromCart",
      body: [
        `await this.removeFromCartButton.waitForClickable({ timeout: 10000 });`,
        `await this.removeFromCartButton.click();`
      ]
    },
    {
      name: "verifyCartCountIncreasedByOne",
      body: [
        `await this.cartCountBadge.waitForDisplayed({ timeout: 10000 });`,
        `// TODO: capture before/after counts and assert delta of 1`
      ]
    },
    {
      name: "verifyCartEmpty",
      body: [`await this.cartEmptyState.waitForDisplayed({ timeout: 10000 });`]
    }
  ]
};

const orderHistorySpec: DomainSpec = {
  featureTitle: "Order History",
  scenarios: [
    {
      title: "User sees past orders sorted by most recent",
      steps: [
        "Given the user is logged in",
        "When the user opens order history",
        "Then the user should see past orders ordered by most recent"
      ]
    },
    {
      title: "User opens an order to see its details",
      steps: [
        "Given the user is on the order history page",
        "When the user opens the first order",
        "Then the user should see the order details"
      ]
    }
  ],
  manualChecks: [
    "Verify date formatting matches locale",
    "Verify order status badge colors",
    "Verify pagination across many orders"
  ],
  impactedAreas: ["Account section", "Order history page", "Order detail page"],
  clarificationQuestions: [
    "How far back should order history go?",
    "What statuses are visible to the user?",
    "Are cancelled orders shown in the same list?"
  ],
  steps: [
    { keyword: "Given", text: "the user is logged in", method: "ensureLoggedIn" },
    { keyword: "Given", text: "the user is on the order history page", method: "openOrderHistory" },
    { keyword: "When", text: "the user opens order history", method: "openOrderHistory" },
    { keyword: "When", text: "the user opens the first order", method: "openFirstOrder" },
    { keyword: "Then", text: "the user should see past orders ordered by most recent", method: "verifyOrdersSortedByRecent" },
    { keyword: "Then", text: "the user should see the order details", method: "verifyOrderDetailsVisible" }
  ],
  locators: [
    "ORDER_HISTORY_LINK",
    "ORDER_LIST_ITEM",
    "ORDER_DATE_LABEL",
    "ORDER_DETAILS_PANEL"
  ],
  getters: [
    { name: "orderHistoryLink", locator: "ORDER_HISTORY_LINK" },
    { name: "orderListItem", locator: "ORDER_LIST_ITEM" },
    { name: "orderDateLabel", locator: "ORDER_DATE_LABEL" },
    { name: "orderDetailsPanel", locator: "ORDER_DETAILS_PANEL" }
  ],
  methods: [
    {
      name: "ensureLoggedIn",
      body: [`// TODO: log in via API or shared session helper`]
    },
    {
      name: "openOrderHistory",
      body: [
        `await this.orderHistoryLink.waitForClickable({ timeout: 10000 });`,
        `await this.orderHistoryLink.click();`
      ]
    },
    {
      name: "openFirstOrder",
      body: [
        `await this.orderListItem.waitForClickable({ timeout: 10000 });`,
        `await this.orderListItem.click();`
      ]
    },
    {
      name: "verifyOrdersSortedByRecent",
      body: [
        `await this.orderListItem.waitForDisplayed({ timeout: 10000 });`,
        `// TODO: read order date labels and assert descending order`
      ]
    },
    {
      name: "verifyOrderDetailsVisible",
      body: [`await this.orderDetailsPanel.waitForDisplayed({ timeout: 10000 });`]
    }
  ]
};

export const domainSpecs: Record<string, DomainSpec> = {
  sdd: sddSpec,
  login: loginSpec,
  shopping: shoppingSpec,
  orderHistory: orderHistorySpec
};

export function getDomainSpec(domainKey: string): DomainSpec | undefined {
  return domainSpecs[domainKey];
}

export function detectDomainKey(
  storyText: string,
  routing: Record<string, string>
): string {
  const text = storyText.toLowerCase();
  for (const [keyword, key] of Object.entries(routing)) {
    if (text.includes(keyword.toLowerCase())) {
      return key;
    }
  }
  return "general";
}

export function findStepMethodForText(
  spec: DomainSpec | undefined,
  scenarioStep: string
): string | undefined {
  if (!spec) return undefined;
  const normalized = stripGherkinKeyword(scenarioStep);
  const match = spec.steps.find((s) => stripGherkinKeyword(s.text) === normalized);
  return match?.method;
}

function stripGherkinKeyword(line: string): string {
  return line
    .replace(/^\s*(Given|When|Then|And|But)\s+/i, "")
    .trim()
    .toLowerCase();
}
