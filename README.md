# in-ference Connections Exporter

A Manifest V3 Chrome extension that exports your LinkedIn connections to a CSV file as you scroll — formatted for direct import into [in-ference](https://in-ference.com).

Forked from [nanaoosaki/linkedin_connections](https://github.com/nanaoosaki/linkedin_connections) (MIT licensed) — see [`LICENSE`](./LICENSE) for full attribution. Everything in "Human–AI collaboration" below describes the upstream project's original build; this fork's own changes are listed in "What changed in the in-ference fork".

Built and maintained as a standalone tool — own toolchain, no dependency on the in-ference app itself. Build-from-source instructions are in Option B below.

---

## What it does

- Watches your LinkedIn connections page and collects every connection card as it loads — **you scroll, it collects.** LinkedIn only loads more of the list in response to a real scroll (see "Why scrolling is manual" below), so this part can't be automated
- Collects name, profile URL, headline, connected date, and message URL for every connection — and parses employer + title out of the headline where the text makes it unambiguous
- Downloads a clean `in-ference-connections.csv` to your machine — no data leaves your browser
- The popup shows a live count (`X of total`) any time you open it, so you always know how far you've gotten

Collection starts the moment you open your connections page and keeps running in the background as you scroll — you don't need to keep the popup open. Click Export whenever you've scrolled far enough; it downloads everyone collected so far, deduplicated.

### Why scrolling is manual

LinkedIn's connections page used to have a clickable "Load more" button, which this extension could click by code. LinkedIn removed it (confirmed 18 Aug 2026) in favour of scroll-triggered loading — and that loading only responds to a **genuine, trusted** scroll event from a real mouse or trackpad. Programmatic scrolling (`scrollTop`, `scrollBy`, even a synthetic `WheelEvent`) was tested directly against a live account and left the page completely unchanged. This is a browser security boundary, not a selector to patch: no code running inside a content script can fabricate a trusted input event. If that ever becomes automatable again within this extension's minimal `activeTab`+`scripting` permissions, it will be — until then, the scroll is yours.

---

## CSV output

```
name,profileUrl,employer,title,headline,connectedOn,messageUrl
Jane Smith,https://www.linkedin.com/in/janesmith/,Acme,Product Manager,"Product Manager at Acme",Connected on March 1 2025,https://www.linkedin.com/messaging/compose/?profileUrn=...
```

Fields: `name`, `profileUrl`, `employer`, `title`, `headline`, `connectedOn`, `messageUrl`

**`employer`/`title` are parsed from `headline`, never fabricated.** They're only populated when the headline contains an unambiguous `Title at Employer` / `Title @ Employer` / `Title — Employer` pattern (`src/domain/headline.ts`). A headline like `Talent Acquisition Lead || VLSI and Embedded || Hardware` (real LinkedIn data — some people separate specialisations with `||` instead) has no such pattern, so both fields come back empty rather than guessed. `headline` is always kept in full alongside the parsed fields, so nothing is lost when parsing can't confidently split it.

---

## Install

There are two ways to install — from the pre-built release (no Node.js required) or from source (for developers who want to inspect or modify the code).

---

### Option A — Pre-built release (recommended for most users)

1. Go to the [Releases page](https://github.com/dermotc/in-ference-connections-exporter/releases)
2. Download `in-ference-connections-exporter.zip` from the latest release
3. Unzip it — you'll get a folder containing `manifest.json`, `content.js`, `popup.js`, `popup.html`, and the icon files
4. Open `chrome://extensions` in Chrome
5. Enable **Developer mode** (top-right toggle)
6. Click **Load unpacked** and select the unzipped folder
7. Pin the extension icon from the puzzle-piece menu

> **Want to verify what you're installing?** The zip is built directly from the source in this repo using `npm run pack`. You can audit every line of `src/` before building it yourself (see Option B).

---

### Option B — Build from source

**Prerequisites:** Node.js 18+, Chrome

```bash
git clone https://github.com/dermotc/in-ference-connections-exporter.git
cd in-ference-connections-exporter
npm install
npm run build        # produces dist/ — the extension folder
```

To also produce the installable zip:

```bash
npm run pack         # runs build, then zips dist/ → in-ference-connections-exporter.zip
```

Then load `dist/` as an unpacked extension (same steps 4–7 above).

> After any rebuild, go to `chrome://extensions` and click the refresh icon on the extension card.

---

### Using the extension

1. Go to `https://www.linkedin.com/mynetwork/invite-connect/connections/`
2. Click the extension icon in the toolbar
3. Click **Export Connections**
4. The progress bar shows `X / total` connections loaded — `linkedin-connections.csv` downloads automatically when complete

---

## Permissions

| Permission | Why |
|-----------|-----|
| `activeTab` | Read the connections page DOM |
| `scripting` | Inject the content script into the active tab |

No network requests are made. No data is sent anywhere. The CSV is written directly to your Downloads folder.

---

## Architecture

```
src/
  domain/
    connection.ts            — Connection interface (single schema)
    headline.ts               — parseHeadline(): splits "Title at Employer" — never fabricates
  content/
    selectors.ts            — All LinkedIn DOM selectors in one place
    parser.ts               — Extracts connection fields from card elements
    scroll.ts               — Load More loop with adaptive wait + deduplication
    index.ts                — Content script entry point; handles EXPORT/PROGRESS messages
  export/
    csv.ts                  — RFC 4180 CSV builder with formula-injection safety
  popup/
    index.ts                — Popup UI; injects content script, polls progress
popup.html                  — Popup markup
manifest.json               — MV3 manifest
```

**Key design decisions:**

- **Passive collection, not automated scrolling (rewritten 18 Aug 2026)** — LinkedIn removed the "Load more" button and now only loads more of the list in response to a genuinely trusted scroll event, which no content script can fabricate (confirmed by direct testing — see "Why scrolling is manual" above). `scroll.ts`'s `startPassiveCollector` just watches the DOM via a `MutationObserver` and collects whatever appears; it never drives clicking or scrolling itself.
- **Collect while scrolling** — LinkedIn uses a virtual list that removes old cards from the DOM as new ones are added. Cards are collected and deduplicated on every DOM-change notification (keyed by `profileUrl`), not parsed once at the end — a card the user has already scrolled past stays collected even after LinkedIn removes it from the DOM.
- **No "done" state** — unlike the old click-loop, there is nothing to detect completion of; only the user knows when they've scrolled far enough. Export packages up whatever has been collected at the moment it's clicked.
- **Dependency injection** — All side effects in `scroll.ts` are injected via `PassiveCollectorDeps` (`getCards`, `getTotalCount`, `onProgress`, `onDomChange`), making the collector fully unit-testable without a browser or a real `MutationObserver`.
- **Zero obfuscated class names** — All selectors are anchored to `data-testid`, structural attributes, or text patterns. `selectors.ts` is the single source of truth with stability annotations.

---

## Development

```bash
npm run check      # lint + typecheck + test + build (run this before committing)
npm run build      # build only
npm test           # jest (123 tests across 5 suites)
```

### Test layout

| Suite | Tests | What it covers |
|-------|-------|----------------|
| `tests/parser.test.ts` | 14 | Field extraction from real LinkedIn HTML fixtures, incl. employer/title honesty-contract cases |
| `tests/scroll.test.ts` | 11 | Load More loop: dedup, stable-cycle stop, virtual list, ProgressInfo |
| `tests/csv.test.ts` | 7 | RFC 4180 quoting, formula-injection safety, employer/title columns |
| `tests/headline.test.ts` | 9 | `parseHeadline()` — delimiter splitting, leftmost-match, never-fabricate cases |
| `tests/readOnlyInvariant.test.ts` | 82 | Mechanical lock: every `src/**/*.ts` file scanned for network/storage calls; manifest permissions asserted |

Fixtures in `tests/fixtures/` are real LinkedIn HTML captured from the live page and sanitised.

---

## Selector maintenance

**Owner: Dermot (in-ference), github.com/dermotc.** LinkedIn's DOM will eventually change and break selectors — this is a known, permanent maintenance cost, not a one-time bug.

**The fix cycle, every time:**
1. A human with a live LinkedIn session captures the current DOM (DevTools → copy `outerHTML` of the affected element, or run the snippets in "Troubleshooting" below).
2. Update the matching selector in `src/content/selectors.ts` — the single file all LinkedIn DOM selectors live in.
3. Add or update an HTML fixture in `tests/fixtures/` from the captured DOM, and a test in `tests/parser.test.ts` that fails against the OLD selector before the fix, passes after (proof-by-broken — this is how every existing fixture was built).
4. `npm run build`, reload the unpacked extension, confirm a real export against the live page.

This cycle cannot be automated away: LinkedIn is login-gated, so only a human with a real session can observe the ground truth. No AI session — this one included — can capture a fixture from a page it cannot log into.

---

## Troubleshooting

**"Exported 0 connections"** — LinkedIn may have updated its DOM. Run this in DevTools Console on the connections page:

```js
document.querySelectorAll('[data-testid="lazy-column"] [data-display-contents="true"] > [componentkey]').length
```

If it returns `0`, the card selector needs updating. Open `src/content/selectors.ts`, inspect the live DOM, update `CARD`, rebuild, and reload.

**"Exported 19 connections" when you have thousands** — this isn't a bug in the extension, it means you haven't scrolled the LinkedIn page yet. Collection only picks up what's actually loaded in the DOM — LinkedIn only loads more as you scroll it yourself (see "Why scrolling is manual" near the top). Scroll down, watch the count in the popup climb, then click Export.

**Popup count doesn't show a total (just a bare number, no "of X")** — `CONNECTIONS_TOTAL_PATTERN` (live-verified 18 Aug 2026 against a real "29,793 connections" account) hasn't matched your page's total-count text, most likely a locale difference (e.g. a non-English "connections" label). Export still works; you just won't see "X of Y". To fix it, find the element on your page:

```js
Array.from(document.querySelectorAll('*')).filter(el =>
  el.children.length === 0 &&
  el.textContent?.match(/^\s*\d{3,}[\s\S]{0,20}connection/i)
).forEach(el => console.log(el.tagName, el.className, '|', el.textContent.trim()));
```

Open an issue with the output and I'll update the selector.

**"Could not establish connection"** — Make sure you're on `https://www.linkedin.com/mynetwork/invite-connect/connections/`. Reload the page and try again.

**Extension still behaves the old way after rebuild** — Go to `chrome://extensions` and click the refresh icon on the extension card.

---

## Known limitations

- LinkedIn DOM selectors may break when LinkedIn deploys updates — particularly obfuscated class names (none are used here, but structural attributes can also change)
- **Scrolling is manual** (see "Why scrolling is manual" above) — this isn't a bug, it's a hard browser boundary. There is no way to fully automate loading the full list from inside this extension's permission model
- `CONNECTIONS_TOTAL_PATTERN` for the "X of Y" count is live-verified against an English-locale account (18 Aug 2026) — a different display locale may need the pattern widened
- Chrome Web Store submission pending — can be loaded unpacked in the meantime (see Install above)

---

## Human–AI collaboration

This project was built entirely through conversation between a human and Claude Code (claude-sonnet-4-6). The full engineering log is in [`AI_ENGINEERING_NOTES.md`](./AI_ENGINEERING_NOTES.md). The collaboration map below summarises who did what and why that division exists.

### What the human supplied

**HTML fixtures** — the single most critical contribution. Both `tests/fixtures/connection-card-basic.html` and `tests/fixtures/connections-list-basic.html` were captured directly from the live LinkedIn page by the human. LinkedIn is login-gated; the AI has no browser, no account, and no way to observe the actual DOM. The fixtures are the only ground truth the AI could test against.

**Live validation** — every real-world test run was performed by the human: loading the unpacked extension in Chrome, clicking Export, and reporting what happened. This is the feedback loop that discovered all the non-obvious bugs:
- The "Receiving end does not exist" error (content script not injected into pre-existing tabs)
- The 20 found / 10 downloaded discrepancy (virtual list recycling)
- The fact that scrolling does nothing — LinkedIn uses a Load More button, not infinite scroll

**The Load More button fixture** — after the scroll approach failed, the human captured the button's `outerHTML` directly from DevTools, which confirmed the button text is `"Load more"` and has no stable `data-testid` or `aria-label` to target.

> **Historical note, added 18 Aug 2026:** the button described above no longer exists — LinkedIn
> replaced it with scroll-triggered loading sometime after this build. See "Why scrolling is
> manual" near the top of this file for what's true today.

**Scope and constraints** — `CLAUDE.md` and `REVIEW.md`, which defined the architecture boundaries and done criteria, were human-authored.

### What the AI supplied

All TypeScript source code, tests, build config, CI workflow, and documentation. Key design contributions:
- Isolating all LinkedIn DOM selectors in a single annotated file (`selectors.ts`) on the first draft
- Replacing obfuscated class selectors with structural and text-pattern alternatives that survive LinkedIn deploys
- The `Map<string, Connection>` deduplication pattern that handles virtual list recycling
- The elapsed-counter polling pattern for the adaptive wait (makes tests deterministic without fake timers)
- RFC 4180 CSV with formula-injection safety

### Where the boundary matters

The hardest constraint: **LinkedIn authentication always requires a human.** Any fixture-capture pipeline depends on a logged-in session. This is a permanent dependency that cannot be engineered around. The practical implication: when LinkedIn updates its DOM and exports break, the fix cycle is always — human captures new DOM snippet → AI updates selectors and tests.

### What this shows about AI-assisted development

The AI was capable of producing a correct, well-tested, production-quality Chrome extension from a spec. It did not require step-by-step instruction for implementation details. But it had a fundamental blind spot: it could not observe the system it was building for. Every real bug was discovered in the gap between the AI's model of LinkedIn's DOM and the actual DOM — and every fix required a human to close that gap with a real observation.

The pattern likely generalises: AI coding assistants are highly effective for closed systems (languages, frameworks, APIs with stable specs) and require ongoing human input for open systems (live websites, external APIs, real hardware) where the ground truth can only be observed, not derived.

See [`AI_ENGINEERING_NOTES.md`](./AI_ENGINEERING_NOTES.md) for the full record: what the model got right immediately, where it hallucinated or overfit, every live-validation discovery, and the reasoning behind each architectural decision.

---

## What changed in the in-ference fork (4 Aug 2026)

Forked from [nanaoosaki/linkedin_connections](https://github.com/nanaoosaki/linkedin_connections) at commit `8e5377a` (tag `v1.0.0`). Changes, in the order they were made:

1. **Rebrand** — name/description in `manifest.json`, icons (`assets/icon-{16,48,128}.png` regenerated from in-ference's own favicon), `logo.png`, `PRIVACY_POLICY.md`, repo URLs throughout the docs. `permissions`/`host_permissions` in `manifest.json` are byte-identical to upstream — deliberately untouched, the minimal set is load-bearing. Added `LICENSE` (MIT) — upstream had none as a file, only a README mention; this fork's file carries both the original author's and this fork's copyright line.
2. **CSV schema** — `src/domain/headline.ts` (new) splits a headline into `title` + `employer` on `" at "`/`" @ "`/`" — "`, honesty-contract: no recognised delimiter or an empty side returns both fields empty rather than a guess. Wired into `parser.ts`; `employer`/`title` added to `Connection` and to the CSV's `HEADERS`. Default download filename renamed `in-ference-connections.csv`.
3. **Read-only invariant, made mechanical** — `tests/readOnlyInvariant.test.ts` scans every `src/**/*.ts` file for `fetch(`/`XMLHttpRequest`/`chrome.storage`/`localStorage`/etc. and asserts `manifest.json`'s permissions haven't grown. Proof-by-broken confirmed: a temporarily-injected `fetch()` call was caught by this test, then reverted.
4. **Selector-maintenance ownership** — named (see "Selector maintenance" above); the DOM-fix cycle itself was already well-documented upstream, just needed an owner attached.
5. **In-ference app side (private, not part of this repo):** the app's own contact-import parser was updated separately to read the `profileUrl` column this tool's CSV exports, so an exported file matches columns the importer already recognised.

**Known follow-up:** the dependency audit (`npm audit`: 10 vulnerabilities inherited from upstream's devDependencies, none in the shipped runtime bundle since nothing from `node_modules` is bundled by esbuild) was not addressed — out of scope for this fork's work items, flagged for a follow-up.

## License

MIT — see [`LICENSE`](./LICENSE). Original work by [nanaoosaki](https://github.com/nanaoosaki/linkedin_connections); fork changes by in-ference.
