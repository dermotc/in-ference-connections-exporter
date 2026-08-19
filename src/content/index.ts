import { parseConnections } from './parser';
import { buildCsv, downloadCsv } from '../export/csv';
import { startPassiveCollector, ProgressInfo } from './scroll';
import { SELECTORS } from './selectors';

declare global {
  interface Window {
    __liExporterLoaded?:    boolean;
    __liExporterProgress?:  ProgressInfo;
  }
}

if (!window.__liExporterLoaded) {
  window.__liExporterLoaded = true;

  // Assisted-scroll mode (18 Aug 2026 — see scroll.ts's header for why):
  // collection starts the moment this script loads, entirely passively.
  // The user scrolls the page themselves; whatever cards that reveals get
  // picked up here. EXPORT just packages up whatever has been collected so
  // far — there is no automated "keep going until done" loop any more.
  const collector = startPassiveCollector({
    getCards: () => parseConnections(document),

    // No stable CSS selector exists for this element (see selectors.ts) — it's
    // matched by text shape instead, same technique the removed Load-more
    // button lookup used to use. Scoped to leaf elements only so a wrapping
    // container (whose textContent includes the count plus everything inside
    // it) can't match ahead of the actual element.
    getTotalCount: () => {
      const el = Array.from(document.querySelectorAll<HTMLElement>('*')).find(
        e => e.children.length === 0 && SELECTORS.CONNECTIONS_TOTAL_PATTERN.test(e.textContent ?? '')
      );
      if (!el) return null;
      const match = el.textContent?.match(/(\d[\d,]*)/);
      return match ? parseInt(match[1].replace(/,/g, ''), 10) : null;
    },

    onProgress: (info) => {
      window.__liExporterProgress = info;
    },

    onDomChange: (callback) => {
      const target = document.querySelector(SELECTORS.LIST);
      if (!target) return () => {};
      const observer = new MutationObserver(callback);
      observer.observe(target, { childList: true, subtree: true });
      return () => observer.disconnect();
    },
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {

    if (msg.type === 'PROGRESS') {
      sendResponse(window.__liExporterProgress ?? { found: 0, total: null, elapsedMs: 0 });
      return false;
    }

    if (msg.type === 'EXPORT') {
      const connections = collector.getCollected();
      const csv = buildCsv(connections);
      downloadCsv(csv);
      sendResponse({ count: connections.length });
      return false;
    }
  });
}
