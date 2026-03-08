import path from "path";
import fg from "fast-glob";
import { Project, SyntaxKind } from "ts-morph";
import { QaEngineConfig } from "../config/schema";

const STEP_FUNCS = new Set(["Given", "When", "Then", "And"]);

export async function scanSteps(repoRoot: string, cfg: QaEngineConfig) {
  const dirAbs = path.join(repoRoot, cfg.paths.stepsDir);
  const files = await fg(["**/*.ts"], { cwd: dirAbs, absolute: true });

  const project = new Project({ useInMemoryFileSystem: false });
  const results: any[] = [];

  for (const file of files) {
    const sf = project.addSourceFileAtPath(file);

    for (const call of sf.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      const expr = call.getExpression().getText();
      if (!STEP_FUNCS.has(expr)) continue;

      const args = call.getArguments();
      if (args.length === 0) continue;

      const first = args[0];
      const keyword = expr as "Given" | "When" | "Then" | "And";
      const pattern = first.getText();

      const calls: string[] = [];
      const cb = args.find((a) =>
        a.getKind() === SyntaxKind.ArrowFunction || a.getKind() === SyntaxKind.FunctionExpression
      );
      if (cb) {
        const bodyText = cb.getText();
        const re = /([a-zA-Z_$][\w$]*)\.([a-zA-Z_$][\w$]*)\s*\(/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(bodyText))) calls.push(`${m[1]}.${m[2]}`);
      }

      results.push({
        file: path.relative(repoRoot, file).split("\\").join("/"),
        keyword,
        pattern,
        calls: Array.from(new Set(calls)).slice(0, 80)
      });
    }
  }

  return results;
}