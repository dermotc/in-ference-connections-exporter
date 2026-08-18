Privacy Policy — in-ference Connections Exporter
Last updated: 2026-08-04

in-ference Connections Exporter does not collect, store, or transmit any personal data. Everything stays on your machine.

WHAT THE EXTENSION DOES
When you click Export Connections, the extension reads the connection cards on your LinkedIn connections page, extracts name, profile URL, headline (and the employer/title parsed from it), connected date, and message URL from the visible DOM, then writes those fields to a CSV file downloaded directly to your browser's Downloads folder. That is the complete list of actions.

WHAT THE EXTENSION DOES NOT DO
- No data collection. No information about you or your connections is collected or retained.
- No network requests. Zero outbound requests. No server, API, or third-party service is contacted.
- No background activity. Runs only when you click Export. Does not track browsing or observe other pages.
- No analytics or telemetry. No usage data or diagnostics are sent anywhere.
- No storage. Does not use chrome.storage, cookies, or any other persistence mechanism.

PERMISSIONS
activeTab — read the DOM of your LinkedIn connections page.
scripting — inject the export script into the active tab when you click Export.
These are the minimum permissions required. They apply only to the tab you are viewing, only when you click Export.

THE CSV FILE
The CSV contains data already visible to you on your LinkedIn page: names, public profile URLs, headlines (plus employer/title split out of the headline text, computed locally — never fabricated), connected dates, and message links. This is your own network data. The file is saved locally and is not sent anywhere by this extension.

THIRD-PARTY SERVICES
None. This extension has no relationship with LinkedIn beyond reading the page you navigate to in your own browser. It has no relationship with in-ference either — you choose separately whether to upload the CSV into in-ference's own contact-import flow, which has its own privacy notice.

CHANGES
If the extension's behaviour changes in a way that affects data handling, this policy will be updated and the version incremented.

CONTACT
support@in-ference.com — or open an issue on this fork's GitHub repository once published.

Based on the original LinkedIn Connections Exporter by nanaoosaki (github.com/nanaoosaki/linkedin_connections, MIT licensed).
