import path from "path";
import fg from "fast-glob";
import { Project, SyntaxKind, ClassDeclaration } from "ts-morph";
import { QaEngineConfig } from "../config/schema";

export async function scanPageObjects(repoRoot: string, cfg: QaEngineConfig) {
  const dirAbs = path.join(repoRoot, cfg.paths.pageObjectsDir);
  const files = await fg(["**/*.ts"], { cwd: dirAbs, absolute: true });

  const project = new Project({ useInMemoryFileSystem: false });
  const results: any[] = [];

  for (const file of files) {
    const sf = project.addSourceFileAtPath(file);

    const imports = sf.getImportDeclarations().map((i) => ({
      module: i.getModuleSpecifierValue(),
      namespace: i.getNamespaceImport()?.getText(),
      named: i.getNamedImports().map((n) => n.getName())
    }));

    const classes = sf.getClasses().filter((c) => c.isExported());

    for (const c of classes) {
      results.push(extractClass(repoRoot, file, c, imports));
    }
  }

  return results;
}

function extractClass(repoRoot: string, file: string, c: ClassDeclaration, imports: any[]) {
  const className = c.getName() ?? "UnnamedClass";

  const methods = c.getMethods().map((m) => ({
    name: m.getName(),
    isAsync: m.isAsync(),
    returnType: m.getReturnTypeNode()?.getText()
  }));

  const getters: any[] = [];
  for (const acc of c.getGetAccessors()) {
    const name = acc.getName();
    const bodyText = acc.getBodyText() ?? "";
    const uses: string[] = [];

    const re = /elmList\.([A-Z0-9_]+)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(bodyText))) uses.push(match[1]);

    getters.push({
      name,
      returnsSelectorFrom: bodyText.includes("elmList.") ? "elmList" : "other",
      usesLocatorKeys: Array.from(new Set(uses))
    });
  }

  return {
    file: path.relative(repoRoot, file).split("\\").join("/"),
    className,
    domainKeyGuess: path
      .basename(file)
      .replace(".ts", "")
      .replace("Page", ""),
    methods,
    getters,
    imports
  };
}