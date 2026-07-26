#!/usr/bin/env node
// Payload parity: assert the Node dist and Python _payload templates are byte-identical.

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const NODE_PAYLOAD = resolve(repoRoot, 'packages/cli-node/dist/templates');
const PY_PAYLOAD = resolve(repoRoot, 'packages/cli-python/_payload');

function log(msg) {
  console.log(`[check-parity] ${msg}`);
}

function fail(msg) {
  console.error(`[check-parity] FAIL: ${msg}`);
  process.exit(1);
}

function ensureExists(label, path) {
  if (!existsSync(path)) {
    fail(
      `${label} payload missing at ${path}\n` +
        `         Run the build first:\n` +
        `           npm run build && npm run build:python`,
    );
  }
}

function walkFiles(root) {
  const out = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        out.push(full);
      } else if (entry.isSymbolicLink()) {
        fail(`symbolic link not allowed in payload: ${full}`);
      }
    }
  }
  return out;
}

function sha256(path) {
  const buf = readFileSync(path);
  return createHash('sha256').update(buf).digest('hex');
}

function buildManifest(root, label) {
  const files = walkFiles(root);
  const manifest = new Map();
  for (const f of files) {
    const rel = relative(root, f).split(/[\\/]/).join('/');
    manifest.set(rel, {
      hash: sha256(f),
      size: statSync(f).size,
    });
  }
  log(`${label}: ${manifest.size} files`);
  return manifest;
}

function diff(nodeManifest, pyManifest) {
  const allKeys = new Set([...nodeManifest.keys(), ...pyManifest.keys()]);
  const onlyNode = [];
  const onlyPy = [];
  const mismatched = [];

  for (const key of [...allKeys].sort()) {
    const n = nodeManifest.get(key);
    const p = pyManifest.get(key);
    if (!n) {
      onlyPy.push(key);
    } else if (!p) {
      onlyNode.push(key);
    } else if (n.hash !== p.hash) {
      mismatched.push({ key, node: n, py: p });
    }
  }
  return { onlyNode, onlyPy, mismatched };
}

function main() {
  ensureExists('Node', NODE_PAYLOAD);
  ensureExists('Python', PY_PAYLOAD);

  const nodeManifest = buildManifest(NODE_PAYLOAD, 'Node');
  const pyManifest = buildManifest(PY_PAYLOAD, 'Python');

  const { onlyNode, onlyPy, mismatched } = diff(nodeManifest, pyManifest);

  if (onlyNode.length === 0 && onlyPy.length === 0 && mismatched.length === 0) {
    log(`PASS - both payloads match (${nodeManifest.size} files)`);
    process.exit(0);
  }

  if (onlyNode.length > 0) {
    console.error(`\n[check-parity] files only in Node payload:`);
    for (const f of onlyNode) console.error(`  + ${f}`);
  }
  if (onlyPy.length > 0) {
    console.error(`\n[check-parity] files only in Python payload:`);
    for (const f of onlyPy) console.error(`  + ${f}`);
  }
  if (mismatched.length > 0) {
    console.error(`\n[check-parity] files with mismatched contents:`);
    for (const m of mismatched) {
      console.error(`  ! ${m.key}`);
      console.error(`      node:   ${m.node.hash}  (${m.node.size} bytes)`);
      console.error(`      python: ${m.py.hash}  (${m.py.size} bytes)`);
    }
  }
  fail(`payload drift detected (${onlyNode.length + onlyPy.length + mismatched.length} issue(s))`);
}

main();
