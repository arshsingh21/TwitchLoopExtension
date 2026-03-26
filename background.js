let cycleIntervalId = null;
let running = false;
let interval = 12;
let cycleCount = 0;
let lastCycleTime = null;

// Restore state on startup (handles event page reload / browser restart)
browser.storage.local.get(["running", "interval", "cycleCount"]).then((data) => {
  if (data.interval) {
    interval = data.interval;
  }
  if (data.cycleCount) {
    cycleCount = data.cycleCount;
  }
  if (data.running) {
    startCycling(interval);
  }
});

function startCycling(sec) {
  if (cycleIntervalId !== null) {
    clearInterval(cycleIntervalId);
  }
  interval = sec;
  running = true;
  lastCycleTime = Date.now();
  browser.storage.local.set({ running: true, interval: sec });
  cycleIntervalId = setInterval(cycleTab, sec * 1000);
}

function stopCycling() {
  if (cycleIntervalId !== null) {
    clearInterval(cycleIntervalId);
    cycleIntervalId = null;
  }
  running = false;
  lastCycleTime = null;
  browser.storage.local.set({ running: false });
}

async function cycleTab() {
  try {
    const tabs = await browser.tabs.query({ currentWindow: true });
    if (tabs.length === 0) return;

    const activeTab = tabs.find((t) => t.active);
    if (!activeTab) return;

    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    const nextTab = tabs[nextIndex];

    await browser.tabs.update(nextTab.id, { active: true });
    await browser.tabs.reload(nextTab.id, { bypassCache: true });
    cycleCount++;
    lastCycleTime = Date.now();
    browser.storage.local.set({ cycleCount });
  } catch (e) {
    // Tab may have been closed mid-cycle; next tick will re-query
  }
}

// Message handler for popup communication
browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.command === "start") {
    const sec = message.interval || 12;
    startCycling(sec);
    sendResponse({ ok: true });
  } else if (message.command === "stop") {
    stopCycling();
    sendResponse({ ok: true });
  } else if (message.command === "getState") {
    sendResponse({ running, interval, cycleCount, lastCycleTime });
  }
});
