#!/usr/bin/env node
// Guards who owns each skill in .agents/skills:
//
// - Public skills (ngx-vest-forms, vestjs) are ours and are what
//   `npx skills add ngx-vest-forms/ngx-vest-forms` is for.
// - Maintainer skills are ours and set `metadata.internal: true`, which hides
//   them from `npx skills add`.
// - Upstream skills belong to their installer and carry no local edits:
//   - skills-lock.json: installed with the `skills` CLI (Angular).
//   - .agents/nx-skills-lock.json: installed with `nx configure-ai-agents`.
//   Each lock records the hash the `skills` CLI uses: sha256 over every file's
//   relative path and content, in sorted order.
//
// Usage: node .github/scripts/check-agent-skills.mjs [--write-nx-lock]
//   --write-nx-lock  record the current Nx skills, after a refresh with
//                    `pnpm nx configure-ai-agents --agents codex`
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const skillsDir = path.join(root, '.agents/skills');
const nxLockPath = path.join(root, '.agents/nx-skills-lock.json');
const publicSkills = new Set(['ngx-vest-forms', 'vestjs']);
const cliLocked = JSON.parse(readFileSync(path.join(root, 'skills-lock.json'), 'utf8')).skills;

function collectFiles(baseDir, currentDir = baseDir) {
  return readdirSync(currentDir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '.git' || entry.name === 'node_modules' ? [] : collectFiles(baseDir, full);
    }
    if (!entry.isFile()) return [];
    return [{ relativePath: path.relative(baseDir, full).split(path.sep).join('/'), content: readFileSync(full) }];
  });
}

function folderHash(skillDir) {
  const hash = createHash('sha256');
  for (const file of collectFiles(skillDir).sort((a, b) => a.relativePath.localeCompare(b.relativePath))) {
    hash.update(file.relativePath);
    hash.update(file.content);
  }
  return hash.digest('hex');
}

function isInternal(skillFile) {
  const frontmatter = readFileSync(skillFile, 'utf8').split(/^---\s*$/m)[1] ?? '';
  return /^metadata:\s*\n(?:[ \t]+.*\n)*?[ \t]+internal:\s*["']?(true|1)["']?\s*$/m.test(`${frontmatter}\n`);
}

const skillNames = readdirSync(skillsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(path.join(skillsDir, entry.name, 'SKILL.md')))
  .map((entry) => entry.name)
  .sort();

if (process.argv.includes('--write-nx-lock')) {
  // After a refresh, every skill that is not ours and not in skills-lock.json
  // came from the Nx installer.
  const nxSkills = skillNames.filter(
    (name) =>
      !publicSkills.has(name) && !(name in cliLocked) && !isInternal(path.join(skillsDir, name, 'SKILL.md')),
  );
  const lock = {
    source: 'nrwl/nx-ai-agents-config',
    skills: Object.fromEntries(nxSkills.map((name) => [name, folderHash(path.join(skillsDir, name))])),
  };
  writeFileSync(nxLockPath, `${JSON.stringify(lock, null, 2)}\n`);
  console.log(`Wrote ${nxSkills.length} Nx skills to ${path.relative(root, nxLockPath)}.`);
  process.exit(0);
}

const nxLock = JSON.parse(readFileSync(nxLockPath, 'utf8'));
const upstream = {
  ...Object.fromEntries(
    Object.entries(cliLocked).map(([name, entry]) => [
      name,
      { hash: entry.computedHash, source: entry.source, restore: '`npx skills update -p`' },
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(nxLock.skills).map(([name, hash]) => [
      name,
      {
        hash,
        source: nxLock.source,
        restore:
          '`pnpm nx configure-ai-agents --agents codex`, then `node .github/scripts/check-agent-skills.mjs --write-nx-lock`',
      },
    ]),
  ),
};

const errors = [];

for (const [name, entry] of Object.entries(upstream)) {
  const skillDir = path.join(skillsDir, name);
  if (!existsSync(skillDir)) {
    errors.push(`${name}: recorded as an upstream skill (${entry.source}) but missing. Restore it with ${entry.restore}.`);
  } else if (folderHash(skillDir) !== entry.hash) {
    errors.push(
      `${name}: differs from its recorded upstream content (${entry.source}). Upstream skills carry no local edits: ` +
        `discard the change, or take a new upstream version with ${entry.restore}.`,
    );
  }
}

for (const name of skillNames) {
  const internal = isInternal(path.join(skillsDir, name, 'SKILL.md'));
  if (name in upstream) continue;
  if (publicSkills.has(name) && internal) {
    errors.push(`${name}: a public skill must not set metadata.internal.`);
  } else if (!publicSkills.has(name) && !internal) {
    errors.push(
      `${name}: unknown owner. A maintainer skill sets \`metadata.internal: true\` in its frontmatter, so ` +
        '`npx skills add` does not offer it. A new Nx skill is recorded with ' +
        '`node .github/scripts/check-agent-skills.mjs --write-nx-lock`.',
    );
  }
}

for (const error of errors) console.error(`::error::${error}`);
console.log(`Agent skills: ${Object.keys(upstream).length} upstream, ${errors.length} errors.`);
process.exit(errors.length > 0 ? 1 : 0);
