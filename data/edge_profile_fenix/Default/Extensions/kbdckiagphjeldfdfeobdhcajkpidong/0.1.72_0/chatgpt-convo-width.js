// 🔧 Development Mode - Set to false for production to reduce console noise
const DEV_MODE = false; // Change to true to enable debug logs

// Conditional logging helpers
const devLog = (...args) => DEV_MODE && console.log(...args);
const devWarn = (...args) => DEV_MODE && console.warn(...args);
// Always log errors
const devError = (...args) => console.error(...args);

(function () {
  // ⚠️ PLATFORM CHECK: This module is ChatGPT-only
  const isChatGPT =
    window.location.hostname.includes("chatgpt.com") ||
    window.location.hostname.includes("chat.openai.com") ||
    window.location.hostname.includes("openai.com");

  if (!isChatGPT) {
    // Silently skip on non-ChatGPT platforms
    return;
  }

  devLog("🎯 ChatGPT conversation width module loaded");

  const WIDTH_ENABLED_KEY = "sp_chatgpt_wide_convo_enabled";
  const WIDTH_PERCENT_KEY = "sp_chatgpt_convo_width_percent";
  const ZUSTAND_KEY = "superprompt-ui-settings";
  const SELECTOR = '[class*="[--thread-content-max-width:"]';

  function clamp(n, min, max) {
    n = Math.floor(Number(n) || 0);
    return Math.max(min, Math.min(max, n));
  }

  function readSettings() {
    try {
      const raw = localStorage.getItem(ZUSTAND_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const s = parsed.state || parsed;
        return {
          enabled: !!s.chatgptWideConvoEnabled,
          percent: clamp(s.chatgptConvoWidthPercent ?? 90, 30, 90),
        };
      }
    } catch {}
    // fallback
    const enabled = localStorage.getItem(WIDTH_ENABLED_KEY) === "1";
    const rawPercent = parseInt(
      localStorage.getItem(WIDTH_PERCENT_KEY) || "90",
      10
    );
    return { enabled, percent: clamp(rawPercent, 30, 90) };
  }

  function apply(percent) {
    const els = document.querySelectorAll(SELECTOR);
    els.forEach((el) => {
      el.style.maxWidth = `${percent}%`;
      el.style.marginLeft = "auto";
      el.style.marginRight = "auto";
    });
    return els.length;
  }
  function clear() {
    const els = document.querySelectorAll(SELECTOR);
    els.forEach((el) => {
      el.style.removeProperty("max-width");
      el.style.removeProperty("margin-left");
      el.style.removeProperty("margin-right");
    });
    return els.length;
  }

  function applyFromStorage() {
    const { enabled, percent } = readSettings();
    if (enabled) apply(percent);
    else clear();
  }

  // Staggered retries to survive mounts
  function schedule() {
    applyFromStorage();
    setTimeout(applyFromStorage, 100);
    setTimeout(applyFromStorage, 300);
    setTimeout(applyFromStorage, 800);
    setTimeout(applyFromStorage, 1500);
  }

  // Public helpers
  window.spForceWidth = function (pct) {
    return apply(clamp(pct, 30, 90));
  };
  window.spClearForcedWidth = function () {
    return clear();
  };

  // Bridges
  window.addEventListener("sp-width-settings-changed", (ev) => {
    try {
      devLog("🎯 Width module received sp-width-settings-changed:", ev.detail);
      const d = ev && ev.detail ? ev.detail : {};
      const en = !!d.enabled;
      const pct = clamp(d.percent ?? 90, 30, 90);
      devLog(`🎯 Applying width: enabled=${en}, percent=${pct}`);
      if (en) apply(pct);
      else clear();
    } catch (e) {
      devError("❌ Error in sp-width-settings-changed handler:", e);
    }
  });
  window.addEventListener("message", (e) => {
    try {
      const data = e && e.data ? e.data : null;
      if (!data || data.type !== "sp-width-settings-changed") return;
      devLog("🎯 Width module received postMessage:", data);
      const payload = data.data || data;
      const en = !!payload.enabled;
      const pct = clamp(payload.percent ?? 90, 30, 90);
      devLog(
        `🎯 Applying width from postMessage: enabled=${en}, percent=${pct}`
      );
      if (en) apply(pct);
      else clear();
    } catch (e) {
      devError("❌ Error in message handler:", e);
    }
  });

  // Navigation/DOM hooks
  window.addEventListener("load", schedule);
  window.addEventListener("pageshow", schedule);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule, { once: true });
  } else {
    setTimeout(schedule, 0);
  }
  try {
    const p = history.pushState.bind(history);
    history.pushState = function (...args) {
      const r = p(...args);
      try {
        schedule();
      } catch {}
      return r;
    };
    const r = history.replaceState.bind(history);
    history.replaceState = function (...args) {
      const rr = r(...args);
      try {
        schedule();
      } catch {}
      return rr;
    };
  } catch {}

  try {
    let t = null;
    const mo = new MutationObserver(() => {
      if (t) return;
      t = setTimeout(() => {
        t = null;
        schedule();
      }, 60);
    });
    mo.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
  } catch {}
})();
