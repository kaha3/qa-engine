export type FrameworkModel = {
  version: "1.0";
  scannedAt: string;
  repoRoot: string;
  suiteRoot: string;

  paths: {
    featuresDir: string;
    stepsDir: string;
    pageObjectsDir: string;
    elementsDir: string;
    elementListFile?: string;
    supportDir: string;
  };

  steps: Array<{
    file: string;
    pattern: string;
    keyword: "Given" | "When" | "Then" | "And";
    calls: string[];
  }>;

  pageObjects: Array<{
    file: string;
    className: string;
    domainKeyGuess?: string;
    methods: Array<{
      name: string;
      isAsync: boolean;
      returnType?: string;
    }>;
    getters: Array<{
      name: string;
      returnsSelectorFrom?: "elmList" | "other";
      usesLocatorKeys: string[];
    }>;
    imports: Array<{
      module: string;
      namespace?: string;
      named?: string[];
    }>;
  }>;

  locators: Array<{
    file: string;
    exportName: string;
    valueType: "string" | "template" | "unknown";
    valuePreview: string;
  }>;
};