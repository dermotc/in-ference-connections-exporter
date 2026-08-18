export interface Connection {
  name: string;
  profileUrl: string;
  headline: string;
  /** Parsed from headline via parseHeadline(). Empty string when not confidently split — never fabricated. */
  title: string;
  /** Parsed from headline via parseHeadline(). Empty string when not confidently split — never fabricated. */
  employer: string;
  connectedOn: string;
  messageUrl: string;
}
