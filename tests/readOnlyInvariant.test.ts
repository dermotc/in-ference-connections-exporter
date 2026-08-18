import * as fs from 'fs';
import * as path from 'path';

/**
 * WI3 (inviolable): this extension is read-only and local. Zero network
 * calls, zero persistence beyond the one-shot CSV download. This test scans
 * every file in src/ for the patterns that would violate that — it is the
 * mechanical lock, not just a README claim.
 *
 * If this test ever needs to change, the invariant has been deliberately
 * broken and PRIVACY_POLICY.md / manifest.json permissions must be updated
 * in the same commit, not after.
 */

const FORBIDDEN_PATTERNS: [RegExp, string][] = [
  [/\bfetch\s*\(/, 'fetch('],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bnavigator\.sendBeacon\b/, 'navigator.sendBeacon'],
  [/\bchrome\.storage\b/, 'chrome.storage'],
  [/\bdocument\.cookie\b/, 'document.cookie'],
  [/\blocalStorage\b/, 'localStorage'],
  [/\bsessionStorage\b/, 'sessionStorage'],
  [/\bindexedDB\b/, 'indexedDB'],
  [/\bWebSocket\b/, 'WebSocket'],
  [/\bnavigator\.sendBeacon\b/, 'navigator.sendBeacon'],
];

function listSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(full);
    if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) return [full];
    return [];
  });
}

const SRC_DIR = path.join(__dirname, '..', 'src');
const sourceFiles = listSourceFiles(SRC_DIR);

test('at least one source file was actually scanned (the check itself is not vacuous)', () => {
  expect(sourceFiles.length).toBeGreaterThan(0);
});

describe.each(sourceFiles)('read-only invariant: %s', (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relative = path.relative(path.join(__dirname, '..'), filePath);

  test.each(FORBIDDEN_PATTERNS)('does not contain %s', (pattern, label) => {
    const match = content.match(pattern);
    if (match) {
      throw new Error(
        `${relative} contains "${label}" — this extension must stay read-only/local. ` +
        `If this is intentional, the invariant has changed: update PRIVACY_POLICY.md and ` +
        `manifest.json permissions in the same commit, then update this test.`,
      );
    }
    expect(match).toBeNull();
  });
});

test('manifest.json requests only the documented minimal permissions', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf-8'),
  );
  expect(manifest.permissions).toEqual(['activeTab', 'scripting']);
  expect(manifest.host_permissions).toEqual(['https://www.linkedin.com/*']);
});
