const exportBtn = document.getElementById('export')  as HTMLButtonElement;
const countEl   = document.getElementById('count')!;
const statusEl  = document.getElementById('status')!;

let currentTabId: number | null = null;

function updateCount(found: number, total: number | null): void {
  countEl.textContent = total !== null ? `(${found} of ${total})` : found > 0 ? `(${found})` : '';
}

async function refreshProgress(): Promise<void> {
  if (!currentTabId) return;
  try {
    const res = await chrome.tabs.sendMessage(currentTabId, { type: 'PROGRESS' });
    if (res) updateCount(res.found, res.total);
  } catch {
    // Content script not ready yet (e.g. tab just navigated) — next poll picks it up.
  }
}

(async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) throw new Error('No active tab');
    currentTabId = tab.id;

    // Defensive re-inject: manifest-declared content_scripts only auto-run on
    // NEW navigations, so a tab that was already open on the connections page
    // before the extension was installed/reloaded never got it. Idempotent —
    // content/index.ts's own __liExporterLoaded guard makes a second injection
    // a no-op if it's already running and already collecting.
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });

    await refreshProgress();
    setInterval(refreshProgress, 800);
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    statusEl.textContent = msg.includes('Cannot access') || msg.includes('activeTab')
      ? 'Navigate to your LinkedIn connections page first.'
      : `Error: ${msg}`;
  }
})();

exportBtn.addEventListener('click', async () => {
  if (!currentTabId) return;
  exportBtn.disabled = true;
  statusEl.textContent = 'Exporting…';

  try {
    const response = await chrome.tabs.sendMessage(currentTabId, { type: 'EXPORT' });
    statusEl.textContent = `Exported ${response.count} connection(s).`;
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    statusEl.textContent = `Error: ${msg}`;
  } finally {
    exportBtn.disabled = false;
  }
});
