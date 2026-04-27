document.addEventListener('DOMContentLoaded', () => {
  const intervalInput = document.getElementById('interval');
  const toggleBtn = document.getElementById('toggleBtn');
  const statsDiv = document.getElementById('stats');
  const countdownEl = document.getElementById('countdown');
  const cycleCountEl = document.getElementById('cycleCount');
  const currentRunCountEl = document.getElementById('currentRunCount');
  let isRunning = false;
  let currentInterval = 12;
  let lastCycleTime = null;
  let countdownTimer = null;
  let lastPoll = 0;

  function startCountdown() {
    stopCountdown();
    countdownTimer = setInterval(tick, 200);
    tick();
  }

  function stopCountdown() {
    if (countdownTimer !== null) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function tick() {
    // Poll background for fresh state every ~1s
    if (Date.now() - lastPoll > 1000) {
      lastPoll = Date.now();
      browser.runtime.sendMessage({ command: "getState" }).then(state => {
        if (state) {
          lastCycleTime = state.lastCycleTime;
          currentInterval = state.interval;
          cycleCountEl.textContent = state.cycleCount;
          currentRunCountEl.textContent = state.currentRunCount || 0;
          if (!state.running) updateUI(state);
        }
      }).catch(() => {});
    }
    // Update countdown display
    if (!lastCycleTime) {
      countdownEl.textContent = '--';
      return;
    }
    const elapsed = (Date.now() - lastCycleTime) / 1000;
    const remaining = Math.max(0, currentInterval - elapsed);
    countdownEl.textContent = Math.ceil(remaining) + 's';
  }

  function updateUI(state) {
    isRunning = state.running;
    if (state.interval !== undefined) {
      intervalInput.value = state.interval;
      currentInterval = state.interval;
    }
    if (state.cycleCount !== undefined) {
      cycleCountEl.textContent = state.cycleCount;
    }
    if (state.currentRunCount !== undefined) {
      currentRunCountEl.textContent = state.currentRunCount;
    }
    if (state.lastCycleTime !== undefined) {
      lastCycleTime = state.lastCycleTime;
    }

    if (isRunning) {
      toggleBtn.textContent = 'Stop';
      toggleBtn.className = 'btn-stop';
      intervalInput.disabled = true;
      toggleBtn.disabled = false;
      statsDiv.style.display = '';
      startCountdown();
    } else {
      toggleBtn.textContent = 'Start';
      toggleBtn.className = 'btn-start';
      intervalInput.disabled = false;
      toggleBtn.disabled = false;
      statsDiv.style.display = 'none';
      stopCountdown();
    }
  }

  // Get initial state. Read interval from storage directly so we get the
  // last-saved value even if the background script's in-memory copy hasn't
  // been hydrated from storage yet (race on browser/extension startup).
  Promise.all([
    browser.runtime.sendMessage({ command: "getState" }),
    browser.storage.local.get(["interval"])
  ])
    .then(([response, stored]) => {
      if (response) {
        if (stored && typeof stored.interval === "number") {
          response.interval = stored.interval;
        }
        updateUI(response);
      }
    })
    .catch(err => {
      console.error("Failed to get initial state from background script.", err);
    });

  intervalInput.addEventListener('input', () => {
    const val = parseInt(intervalInput.value, 10);
    if (!isNaN(val) && val >= 1) {
      browser.runtime.sendMessage({ command: "setInterval", interval: val }).catch(() => {});
    }
  });

  toggleBtn.addEventListener('click', () => {
    if (isRunning) {
      browser.runtime.sendMessage({ command: "stop" })
        .then(response => {
          if (response && response.ok) {
            updateUI({ running: false, interval: parseInt(intervalInput.value, 10) });
          }
        })
        .catch(err => {
          console.error("Failed to send stop command.", err);
        });
    } else {
      let intervalVal = parseInt(intervalInput.value, 10);
      if (isNaN(intervalVal) || intervalVal < 1) {
        intervalVal = 12; // default fallback
        intervalInput.value = intervalVal;
      }
      browser.runtime.sendMessage({ command: "start", interval: intervalVal })
        .then(response => {
          if (response && response.ok) {
            updateUI({ running: true, interval: intervalVal, currentRunCount: 0, lastCycleTime: Date.now() });
          }
        })
        .catch(err => {
          console.error("Failed to send start command.", err);
        });
    }
  });
});
