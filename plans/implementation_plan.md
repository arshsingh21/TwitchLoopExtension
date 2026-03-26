# TwitchLoop Firefox Extension Implementation Plan

This plan details the creation of a custom Firefox extension that will replace the AutoHotkey cycling and refreshing logic. It is split into two independent flows that can be worked on in parallel, then integrated.

---

## Flow 1: Background Engine & Manifest

**Owner:** Agent A
**Deliverables:** `manifest.json`, `background.js`, `icons/`

### [NEW] `manifest.json`
Defines the extension with the following:
- Permissions: `tabs`, `storage`.
- `browser_specific_settings` with a `gecko.id` for Firefox compatibility.
- `action` with a default popup pointing to `popup.html` and extension icons.
- Background script registered as a non-persistent event page.

Note: The `alarms` permission is **not** used. The `alarms` API enforces a minimum interval of ~1 minute, which is far too slow for our 12-second cycle. We use `setInterval` instead.

### [NEW] `icons/` (16, 48, 128px)
Simple extension icons so Firefox displays a recognizable toolbar button instead of a generic puzzle piece. Can be simple colored SVGs converted to PNG.

### [NEW] `background.js`
The heart of the extension. It will:
1. Listen for messages from the popup via `browser.runtime.onMessage`. Expected message types:
   - `{ command: "start", interval: <number> }` — begin cycling.
   - `{ command: "stop" }` — stop cycling.
   - `{ command: "getState" }` — return current state (`{ running: bool, interval: number }`).
2. On start, use `setInterval` to schedule the cycle at the configured interval (default 12 seconds).
3. On each tick:
   a. Query the current window for all tabs via `browser.tabs.query({ currentWindow: true })`.
   b. Find the currently active tab and calculate the next tab index (wrapping around).
   c. Activate the next tab via `browser.tabs.update(tabId, { active: true })`.
   d. Hard-refresh the tab via `browser.tabs.reload(tabId, { bypassCache: true })` to bypass the cache (equivalent to Ctrl+Shift+R).
4. On stop, clear the interval.
5. Persist running state and settings to `browser.storage.local` so state survives background script suspension.
6. On script startup (e.g., after browser restart or event page reload), check `browser.storage.local` and automatically resume cycling if it was previously running.
7. Handle edge cases: if tabs are closed mid-cycle and the stored index is out of bounds, wrap to tab 0.

### Message Contract (shared with Flow 2)
The background script and popup communicate via `browser.runtime.sendMessage` / `browser.runtime.onMessage`:

| Direction | Message | Response |
|---|---|---|
| Popup → Background | `{ command: "start", interval: 12 }` | `{ ok: true }` |
| Popup → Background | `{ command: "stop" }` | `{ ok: true }` |
| Popup → Background | `{ command: "getState" }` | `{ running: bool, interval: number }` |

---

## Flow 2: Popup UI

**Owner:** Agent B
**Deliverables:** `popup.html`, `popup.css`, `popup.js`

### [NEW] `popup.html`
A simple flyout menu containing:
- A prominent Start/Stop toggle button.
- A number input field to configure the cycle interval in seconds (default: 12, matching the AHK script).
- Minimal, clean styling.

### [NEW] `popup.css`
Basic styles for the popup. Keep it compact (300px max width) and readable.

### [NEW] `popup.js`
1. On popup open, send `{ command: "getState" }` to the background script and display the current state.
2. When the user clicks the toggle button:
   - If stopped: read the interval input value and send `{ command: "start", interval: <value> }`.
   - If running: send `{ command: "stop" }`.
3. Update the UI to reflect the active state (e.g., button text/color changes, interval input disabled while running).

### Message Contract (shared with Flow 1)
Uses the same contract defined in Flow 1. The popup only sends messages and renders based on responses — it has no direct tab/cycling logic.

---

## Integration

Once both flows are complete:
1. Place all files in a single directory (`TwitchLoopExtension/`).
2. Ensure `manifest.json` references `popup.html` and `background.js` correctly.
3. Run the verification plan below.

## Verification Plan

### Manual Verification
1. Load the extension into Firefox via `about:debugging` > "This Firefox" > "Load Temporary Add-on".
2. Open multiple tabs (e.g., several Twitch streams).
3. Click the extension icon, set the interval to something short (e.g., 3 seconds for testing), and click Start.
4. Verify that the browser automatically switches to the next tab and hard-refreshes it (cache bypass) on each tick.
5. Verify that the cycle wraps around after the last tab.
6. Close a tab mid-cycle and verify the extension handles it gracefully without errors.
7. Verify that clicking Stop halts the cycle, and clicking Start resumes it.
