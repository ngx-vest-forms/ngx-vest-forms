#!/usr/bin/env node
// Type-checks the TypeScript examples of the published agent skills against
// the library source and the installed Vest, so an example that no longer
// compiles fails CI instead of reaching the people who install the skills.
//
// A fenced `ts` block is checked when it has an `import ... from` statement:
// that makes it a complete module. A block without one is a fragment and is
// skipped. To keep an example checked, give it its imports and types. A
// relative import (`./travel.model`) is accepted without a check.
//
// Usage: node .github/scripts/check-skill-snippets.mjs [--keep]
//   --keep  leave the extracted files in tmp/skill-snippets for inspection
import { mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const skillRoots = ['.agents/skills/ngx-vest-forms', '.agents/skills/vestjs'];
const outDir = path.join(root, 'tmp/skill-snippets');
const keep = process.argv.includes('--keep');

function markdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return markdownFiles(full);
    return entry.name.endsWith('.md') ? [full] : [];
  });
}

/** Fenced ts blocks of one file, with the line each block starts on. */
function tsBlocks(file) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const blocks = [];
  let open = null;
  lines.forEach((line, index) => {
    const fence = line.match(/^(\s*)```(\w*)\s*$/);
    if (!fence) {
      if (open) open.lines.push(line.slice(open.indent));
      return;
    }
    if (open) {
      blocks.push(open);
      open = null;
    } else if (fence[2] === 'ts' || fence[2] === 'typescript') {
      open = { file, line: index + 2, indent: fence[1].length, lines: [] };
    } else {
      open = { skip: true, indent: 0, lines: [] };
    }
  });
  return blocks.filter((block) => !block.skip);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const sources = new Map();
let fragments = 0;
for (const skillRoot of skillRoots) {
  for (const file of markdownFiles(path.join(root, skillRoot))) {
    for (const block of tsBlocks(file)) {
      const code = block.lines.join('\n');
      if (!/^\s*import\s[^;]*?from\s+['"]/m.test(code)) {
        fragments += 1;
        continue;
      }
      const name = `${path.relative(root, file).replace(/[^\w]+/g, '_')}_L${block.line}.ts`;
      const target = path.join(outDir, name);
      writeFileSync(target, `${code}\n`);
      sources.set(target, block);
    }
  }
}

// `n4s` is a dependency of Vest, not of this workspace. pnpm keeps it next to
// Vest's real location, which is where the `compose` example imports it from.
const n4s = path.join(path.dirname(realpathSync(path.join(root, 'node_modules/vest'))), 'n4s');

const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const program = ts.createProgram([...sources.keys()], {
  ...options,
  noEmit: true,
  sourceMap: false,
  declaration: false,
  noUnusedLocals: false,
  noUnusedParameters: false,
  paths: { ...options.paths, n4s: [n4s] },
});

// An example may import a sibling file of its own (`./travel.model`). That
// file does not exist here, so its imports are left unchecked.
const isSiblingImport = (diagnostic) =>
  diagnostic.code === 2307 &&
  /Cannot find module '\.{1,2}\//.test(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));

const diagnostics = ts
  .getPreEmitDiagnostics(program)
  .filter((diagnostic) => diagnostic.file && sources.has(diagnostic.file.fileName))
  .filter((diagnostic) => !isSiblingImport(diagnostic));

for (const diagnostic of diagnostics) {
  const block = sources.get(diagnostic.file.fileName);
  const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  console.error(
    `${path.relative(root, block.file)}:${block.line + position.line} TS${diagnostic.code}: ${message}`,
  );
}

if (!keep) rmSync(outDir, { recursive: true, force: true });

console.log(
  `Skill snippets: ${sources.size} checked, ${fragments} fragments skipped, ${diagnostics.length} errors.`,
);
if (sources.size === 0) {
  console.error('No snippet was checked: the extraction is broken.');
  process.exit(2);
}
process.exit(diagnostics.length > 0 ? 1 : 0);
