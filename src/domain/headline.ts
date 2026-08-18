export interface ParsedHeadline {
  title: string;
  employer: string;
}

/**
 * Delimiters that separate a job title from an employer in a LinkedIn
 * headline, in the order LinkedIn's own UI conventions use them. Each
 * delimiter requires whitespace on both sides so it never matches inside
 * a word (e.g. the "at" in "Data").
 */
const DELIMITERS = [' at ', ' @ ', ' — '];

const EMPTY: ParsedHeadline = { title: '', employer: '' };

/**
 * Splits a free-text LinkedIn headline into a title and an employer.
 *
 * Honesty contract: if no recognised delimiter is present, or if either
 * side of the split would be empty, this returns { title: '', employer: '' }
 * rather than guessing — the whole headline is never fabricated into a
 * title with an empty employer, or vice versa. An absent field must read as
 * absent, not as a wrong guess dressed as data.
 */
export function parseHeadline(headline: string): ParsedHeadline {
  let earliestIndex = -1;
  let matchedDelimiter = '';

  for (const delimiter of DELIMITERS) {
    const index = headline.indexOf(delimiter);
    if (index !== -1 && (earliestIndex === -1 || index < earliestIndex)) {
      earliestIndex = index;
      matchedDelimiter = delimiter;
    }
  }

  if (earliestIndex === -1) return EMPTY;

  const title = headline.slice(0, earliestIndex).trim();
  const employer = headline.slice(earliestIndex + matchedDelimiter.length).trim();

  if (!title || !employer) return EMPTY;

  return { title, employer };
}
