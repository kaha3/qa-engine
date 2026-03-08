import path from "path";
import fg from "fast-glob";
import { Project, SyntaxKind } from "ts-morph";
import { QaEngineConfig } from "../config/schema";

export async function scanLocators(repoRoot: string, cfg: QaEngineConfig) {
  const elementsDirAbs = path.join(repoRoot, cfg.paths.elementsDir);
  const files = await fg(["**/*.ts"], { cwd: elementsDirAbs, absolute: true });

  const project = new Project({ useInMemoryFileSystem: false });
  const results: Array<any> = [];

  for (const file of files) {
    const sf = project.addSourceFileAtPath(file);

    for (const decl of sf.getVariableDeclarations()) {
      const stmt = decl.getFirstAncestorByKind(SyntaxKind.VariableStatement);
      if (!stmt) continue;
      if (!stmt.isExported()) continue;

      const name = decl.getName();
      const init = decl.getInitializer();
      if (!init) continue;

      let valueType: "string" | "template" | "unknown" = "unknown";
      const preview = init.getText().slice(0, 160);

      if (init.getKind() === SyntaxKind.StringLiteral) valueType = "string";
      if (init.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral) valueType = "template";
      if (init.getKind() === SyntaxKind.TemplateExpression) valueType = "template";

      results.push({
        file: path.relative(repoRoot, file).split("\\").join("/"),
        exportName: name,
        valueType,
        valuePreview: preview
      });
    }
  }

  return results;
}