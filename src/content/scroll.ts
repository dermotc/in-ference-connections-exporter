/**
 * Passive collection for the assisted-scroll export flow.
 *
 * CHANGED 18 Aug 2026 (founder-observed live, 19 of 29,793 connections
 * exported): LinkedIn's connections page dropped the clickable "Load more"
 * button entirely, and the replacement infinite-scroll ONLY loads more
 * content in response to a genuinely trusted (real mouse/trackpad) scroll
 * event — confirmed live: `element.scrollTop = x`, `scrollBy()`, and a
 * synthetic `WheelEvent` dispatch all left the DOM completely unchanged,
 * while a real scroll loaded dozens more connections every time. This is a
 * hard browser security boundary (only genuine user input produces trusted
 * events), not a selector that can be patched — no code running inside a
 * content script (this extension's `activeTab`+`scripting` permission
 * model) can fabricate it.
 *
 * New design: the user scrolls for real; this module just watches the DOM
 * and collects + deduplicates whatever appears, continuously, with no
 * click/scroll driving of its own. Export packages up whatever has been
 * collected at the moment the user clicks it — there is no "done" state to
 * detect, because only the user knows when they've scrolled far enough.
 *
 * All side-effectful operations are injected as dependencies so this module
 * is fully unit-testable without a real browser or a real MutationObserver.
 */

import { Connection } from '../domain/connection';

export interface ProgressInfo {
  found:        number;         // unique connections collected so far
  total:        number | null;  // total from page element (null if unavailable)
  elapsedMs:    number;         // ms since collection started
}

export interface PassiveCollectorDeps {
  /** Returns all connection cards currently visible in the DOM. */
  getCards: () => Connection[];
  /** Total connections shown on the page (e.g. "29,793 connections"). Null if unavailable. */
  getTotalCount: () => number | null;
  /** Called after each cycle that found at least one new card. */
  onProgress: (info: ProgressInfo) => void;
  /**
   * Subscribes to "the DOM may have changed, re-check for new cards."
   * Production passes a MutationObserver-backed implementation (see
   * content/index.ts); tests pass a manually-triggerable stub. Returns an
   * unsubscribe function.
   */
  onDomChange: (callback: () => void) => () => void;
}

export interface PassiveCollectorHandle {
  /** Current deduplicated collection, in first-seen order. */
  getCollected: () => Connection[];
  /** Stops watching the DOM. */
  stop: () => void;
}

/**
 * Starts passively collecting connection cards as they appear in the DOM —
 * whether from the user scrolling, LinkedIn's own lazy-rendering, or
 * anything else. Ingests whatever is already visible immediately, then
 * re-checks on every DOM-change notification.
 */
export function startPassiveCollector(deps: PassiveCollectorDeps): PassiveCollectorHandle {
  const { getCards, getTotalCount, onProgress, onDomChange } = deps;

  const collected = new Map<string, Connection>();
  const startTime = Date.now();

  function ingest(cards: Connection[]): number {
    const before = collected.size;
    for (const card of cards) {
      const key = card.profileUrl || card.name;
      if (key && !collected.has(key)) collected.set(key, card);
    }
    return collected.size - before;
  }

  function buildProgress(): ProgressInfo {
    return {
      found:     collected.size,
      total:     getTotalCount(),
      elapsedMs: Date.now() - startTime,
    };
  }

  // Collect whatever is already visible the moment collection starts.
  ingest(getCards());
  onProgress(buildProgress());

  const unsubscribe = onDomChange(() => {
    const added = ingest(getCards());
    if (added > 0) onProgress(buildProgress());
  });

  return {
    getCollected: () => Array.from(collected.values()),
    stop: unsubscribe,
  };
}
