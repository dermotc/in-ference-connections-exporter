/**
 * All LinkedIn DOM selectors in one place.
 *
 * Selector stability notes:
 *   HIGH stability   — structural attributes LinkedIn ships for accessibility/testing
 *   MEDIUM stability — href patterns tied to URL scheme, unlikely to change
 *   LOW stability    — obfuscated class names (change on each LinkedIn deploy)
 *
 * This module intentionally contains NO obfuscated class names.
 * Name, headline, and connected-date are extracted by structure and text pattern
 * in parser.ts rather than by class.
 */
export const SELECTORS = {
  /** HIGH — list container; LinkedIn uses data-testid for its own QA */
  LIST: '[data-testid="lazy-column"]',

  /** HIGH — each visible card is a direct child componentkey element inside the display-contents wrapper */
  CARD: '[data-testid="lazy-column"] [data-display-contents="true"] > [componentkey]',

  /**
   * MEDIUM — profile text link (wraps name + headline).
   * Distinguished from the photo link by the absence of an inline style attribute.
   * The photo thumbnail anchor always carries style="height:7.2rem;width:7.2rem";
   * the text link never has an inline style.
   */
  PROFILE_TEXT_LINK: 'a[href*="linkedin.com/in/"]:not([style])',

  /** MEDIUM — any profile link; used to extract the href */
  PROFILE_LINK: 'a[href*="linkedin.com/in/"]',

  /** MEDIUM — compose message deep-link */
  MESSAGE_LINK: 'a[href*="/messaging/compose/"]',

  /**
   * LOW/text-pattern — live-verified 18 Aug 2026 against a real account: the total-count
   * element (e.g. "29,793 connections") is a bare `<p>` with fully obfuscated class names
   * and no data-testid/id/aria-label at all — there is no stable CSS selector for it, only
   * its text shape. Matched by CONNECTIONS_TOTAL_PATTERN in index.ts (find the first leaf
   * element whose text matches), not by querySelector. Previously a static CSS-selector
   * guess (`[data-testid="connections-count"], .mn-connections__header h1`) that had never
   * actually matched anything live — this replaces it with what was actually verified.
   */
  CONNECTIONS_TOTAL_PATTERN: /^\s*\d{1,3}(,\d{3})*\s+connections?\s*$/i,
} as const;
