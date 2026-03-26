let cycleIntervalId = null;
let iconUpdateIntervalId = null;
let running = false;
let interval = 12;
let cycleCount = 0; // Total tabs cycled (all time)
let currentRunCount = 0; // Tabs cycled in current run
let lastCycleTime = null;

// Draw icon with countdown number or greyed out
function updateIcon(countdown) {
  const canvas = new OffscreenCanvas(128, 128);
  const ctx = canvas.getContext('2d');

  if (countdown !== null) {
    // Active state - bright with countdown
    ctx.fillStyle = '#9146FF'; // Twitch purple
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, 2 * Math.PI);
    ctx.fill();

    // Draw countdown number
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(countdown.toString(), 64, 68);
  } else {
    // Inactive state - greyed out
    ctx.fillStyle = '#666666';
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, 2 * Math.PI);
    ctx.fill();

    // Draw pause/stopped symbol
    ctx.fillStyle = '#999999';
    ctx.fillRect(45, 40, 15, 48);
    ctx.fillRect(68, 40, 15, 48);
  }

  const imageData = ctx.getImageData(0, 0, 128, 128);
  browser.browserAction.setIcon({ imageData: imageData });
}

// Start periodic icon updates
function startIconUpdates() {
  stopIconUpdates();
  iconUpdateIntervalId = setInterval(() => {
    if (!running || !lastCycleTime) {
      updateIcon(null);
      return;
    }
    const elapsed = (Date.now() - lastCycleTime) / 1000;
    const remaining = Math.max(0, interval - elapsed);
    const countdown = Math.ceil(remaining);
    updateIcon(countdown > 0 ? countdown : interval);
  }, 500);
}

function stopIconUpdates() {
  if (iconUpdateIntervalId !== null) {
    clearInterval(iconUpdateIntervalId);
    iconUpdateIntervalId = null;
  }
}

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
  } else {
    updateIcon(null); // Show greyed out icon on startup if not running
  }
});

function startCycling(sec) {
  if (cycleIntervalId !== null) {
    clearInterval(cycleIntervalId);
  }
  interval = sec;
  running = true;
  currentRunCount = 0; // Reset current run count when starting
  lastCycleTime = Date.now();
  browser.storage.local.set({ running: true, interval: sec });
  cycleIntervalId = setInterval(cycleTab, sec * 1000);
  startIconUpdates(); // Start updating icon with countdown
}

function stopCycling() {
  if (cycleIntervalId !== null) {
    clearInterval(cycleIntervalId);
    cycleIntervalId = null;
  }
  running = false;
  lastCycleTime = null;
  browser.storage.local.set({ running: false });
  stopIconUpdates(); // Stop icon countdown updates
  updateIcon(null); // Show greyed out icon when stopped
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
    currentRunCount++;
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
    sendResponse({ running, interval, cycleCount, currentRunCount, lastCycleTime });
  }
});
