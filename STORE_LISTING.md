# Chrome Web Store Listing Copy

---

## Extension name

in-ference Connections Exporter

---

## Short description (132 chars max)

Export your LinkedIn connections to a CSV — name, employer, title, profile URL — ready to import into in-ference. No manual copying.

*(131 chars)*

---

## Detailed description

Export your entire LinkedIn network to a CSV file with a single click.

**What it exports**
- Full name
- LinkedIn profile URL
- Employer and job title (parsed from the headline, never guessed)
- Headline (full text, always kept)
- Date connected
- Direct message link

**How it works**
Navigate to your LinkedIn connections page, click the extension icon, and click Export. The extension automatically clicks "Load more" until all your connections are loaded, then downloads a clean CSV file to your computer. No scrolling required.

**Privacy first**
- No data is collected or sent anywhere
- No accounts, logins, or API keys required
- The CSV file is saved directly to your Downloads folder — nothing leaves your machine
- The extension runs only when you click Export; it does not run in the background

**Tested with 500+ connections** — typically completes in under a minute.

**Use cases**
- Back up your professional network
- Import contacts into a CRM or spreadsheet
- Analyse your network by company, role, or connection date
- Keep a local record independent of LinkedIn

**Open source**
Full source code is available at github.com/dermotc/in-ference-connections-exporter. Forked from nanaoosaki/linkedin_connections (MIT).

---

## Category

Productivity

---

## Language

English

---

## Permissions justification (for Google's review form)

**activeTab**
The extension reads the DOM of the LinkedIn connections page that the user has navigated to. It accesses only the currently active tab, only when the user explicitly clicks the Export button. No other tabs or pages are accessed.

**scripting**
The extension injects a content script into the active LinkedIn connections tab to automate clicking the "Load more" button and collecting connection data. This injection happens only on demand (user clicks Export) and only on the LinkedIn connections page. No scripts are injected into any other site.

---

## Screenshots guidance

Take these in Chrome with the extension loaded unpacked:

1. **Popup during export** — show the progress bar filling with "Loading connections… 320 / 535" text
2. **Popup complete** — show "Exported 535 connection(s)."
3. **CSV in Excel/Sheets** — open the downloaded file, show a few rows with all five columns visible
4. **Connections page** — show the LinkedIn connections page with the extension icon in the toolbar (before clicking)

Screenshot size: 1280×800 or 640×400, PNG or JPEG.

---

## Store icon

Use `assets/icon-128.png` (already generated from logo.png).

---

## Privacy policy URL

Paste this into the Chrome Web Store Developer Console privacy policy field:

```
https://raw.githubusercontent.com/dermotc/in-ference-connections-exporter/main/PRIVACY_POLICY.md
```

> **Corrected 18 Aug 2026** — this previously pointed at the upstream author's own repo
> (`nanaoosaki/linkedin_connections`), whose privacy policy is a different document from
> this fork's own `PRIVACY_POLICY.md`. Now points at the fork's own file, live at
> `github.com/dermotc/in-ference-connections-exporter` (pushed 18 Aug 2026). If you use
> GitHub Pages, use that URL instead (cleaner rendering). To enable: repo Settings → Pages
> → Deploy from branch → `main` / `/ (root)`.

---

## Submission checklist

- [ ] Run `npm run pack` → upload `in-ference-connections-exporter.zip`
- [ ] Store icon: `assets/icon-128.png` (128×128 PNG)
- [ ] Short description: paste from above (131 chars)
- [ ] Detailed description: paste from above
- [ ] Category: Productivity
- [ ] Privacy policy URL: raw GitHub URL above
- [ ] Permissions justification: paste `activeTab` + `scripting` text above
- [ ] Screenshots: 4 × 1280×800 PNG (see Screenshots guidance above)
- [ ] Verify repo is public before submitting
