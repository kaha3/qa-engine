type Op = { kind: "equal" | "add" | "del"; line: string };

function lcsTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const table: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        table[i][j] = table[i + 1][j + 1] + 1;
      } else {
        table[i][j] = Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
  }

  return table;
}

function diffLines(oldLines: string[], newLines: string[]): Op[] {
  const table = lcsTable(oldLines, newLines);
  const ops: Op[] = [];
  let i = 0;
  let j = 0;

  while (i < oldLines.length && j < newLines.length) {
    if (oldLines[i] === newLines[j]) {
      ops.push({ kind: "equal", line: oldLines[i] });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      ops.push({ kind: "del", line: oldLines[i] });
      i++;
    } else {
      ops.push({ kind: "add", line: newLines[j] });
      j++;
    }
  }

  while (i < oldLines.length) {
    ops.push({ kind: "del", line: oldLines[i++] });
  }

  while (j < newLines.length) {
    ops.push({ kind: "add", line: newLines[j++] });
  }

  return ops;
}

type Hunk = {
  oldStart: number;
  oldLen: number;
  newStart: number;
  newLen: number;
  lines: string[];
};

function buildHunks(ops: Op[], context = 3): Hunk[] {
  const hunks: Hunk[] = [];

  let oldLine = 1;
  let newLine = 1;
  let i = 0;

  while (i < ops.length) {
    if (ops[i].kind === "equal") {
      oldLine++;
      newLine++;
      i++;
      continue;
    }

    let start = i;
    let leadingContext = 0;
    while (start > 0 && ops[start - 1].kind === "equal" && leadingContext < context) {
      start--;
      leadingContext++;
    }

    let end = i;
    while (end < ops.length) {
      if (ops[end].kind !== "equal") {
        end++;
        continue;
      }

      let trailingContext = 0;
      let lookahead = end;
      while (lookahead < ops.length && ops[lookahead].kind === "equal" && trailingContext < context) {
        trailingContext++;
        lookahead++;
      }

      const moreChangesAhead = lookahead < ops.length && ops[lookahead].kind !== "equal";
      if (moreChangesAhead) {
        end = lookahead;
        continue;
      }

      end += trailingContext;
      break;
    }

    const hunkOps = ops.slice(start, end);
    const oldStart = oldLine - leadingContext;
    const newStart = newLine - leadingContext;

    let oldLen = 0;
    let newLen = 0;
    const lines: string[] = [];

    for (const op of hunkOps) {
      if (op.kind === "equal") {
        lines.push(` ${op.line}`);
        oldLen++;
        newLen++;
      } else if (op.kind === "del") {
        lines.push(`-${op.line}`);
        oldLen++;
      } else {
        lines.push(`+${op.line}`);
        newLen++;
      }
    }

    hunks.push({
      oldStart: oldLen === 0 ? oldStart - 1 : oldStart,
      oldLen,
      newStart: newLen === 0 ? newStart - 1 : newStart,
      newLen,
      lines
    });

    for (const op of hunkOps) {
      if (op.kind !== "add") oldLine++;
      if (op.kind !== "del") newLine++;
    }
    i = start + hunkOps.length;
  }

  return hunks;
}

export function unifiedDiff(
  oldText: string,
  newText: string,
  oldPath: string,
  newPath: string,
  contextLines = 3
): string {
  if (oldText === newText) return "";

  const isNewFile = oldText.length === 0;
  const oldLines = oldText.length === 0 ? [] : oldText.replace(/\r\n/g, "\n").split("\n");
  if (oldLines.length > 0 && oldLines[oldLines.length - 1] === "") oldLines.pop();

  const newLines = newText.length === 0 ? [] : newText.replace(/\r\n/g, "\n").split("\n");
  if (newLines.length > 0 && newLines[newLines.length - 1] === "") newLines.pop();

  const ops = diffLines(oldLines, newLines);
  const hunks = buildHunks(ops, contextLines);

  const header: string[] = [];
  header.push(`diff --git a/${oldPath} b/${newPath}`);
  if (isNewFile) {
    header.push(`new file mode 100644`);
    header.push(`--- /dev/null`);
  } else {
    header.push(`--- a/${oldPath}`);
  }
  header.push(`+++ b/${newPath}`);

  const body: string[] = [];
  for (const hunk of hunks) {
    const oldRange = hunk.oldLen === 1 ? `${hunk.oldStart}` : `${hunk.oldStart},${hunk.oldLen}`;
    const newRange = hunk.newLen === 1 ? `${hunk.newStart}` : `${hunk.newStart},${hunk.newLen}`;
    body.push(`@@ -${oldRange} +${newRange} @@`);
    body.push(...hunk.lines);
  }

  return `${header.join("\n")}\n${body.join("\n")}\n`;
}
