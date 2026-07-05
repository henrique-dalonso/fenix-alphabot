(function () {
  // ⚠️ PLATFORM CHECK: This script is ChatGPT-only
  const isChatGPT =
    window.location.hostname.includes("chatgpt.com") ||
    window.location.hostname.includes("chat.openai.com") ||
    window.location.hostname.includes("openai.com");

  if (!isChatGPT) {
    // Silently skip on non-ChatGPT platforms to prevent CSS/DOM interference
    return;
  }

  // ████████████████████████████████████████████████████████████████████████████
  // ██                    LEGACY CODE DISABLED                                ██
  // ██                                                                        ██
  // ██  All legacy implementations are disabled. Features are now handled     ██
  // ██  by modular JS files (quickAccessMenu.js, messageOverlays.js,          ██
  // ██  notesManager.js, vaultSidebar.js) loaded by the content script.       ██
  // ██                                                                        ██
  // ██  This eliminates duplicate observers, listeners, and DOM operations.   ██
  // ██  Set flags to false only if modules fail to load (emergency fallback). ██
  // ████████████████████████████████████████████████████████████████████████████
  const USE_LEGACY_NOTES_UI = false; // notesManager.js handles this
  const USE_LEGACY_VAULT_SIDEBAR = false; // vaultSidebar.js handles this

  // Use production-safe logger that respects debug mode
  const logger = window.SuperPromptDebugLogger?.createLogger(
    "ChatGPT Page Listener",
  ) || {
    log: () => {}, // No-op in production if logger not available
    warn: () => {},
    error: (...args) => console.error("[ChatGPT Page Listener]", ...args), // Errors always visible
  };

  // Logging helpers (now using production-safe logger)
  const devLog = logger.log;
  const devWarn = logger.warn;
  const devError = logger.error;
  // Note: DO NOT create 'const log' or 'const logError' here - they are redefined as functions later

  // ████████████████████████████████████████████████████████████████████████████
  // ██                         PRIVACY MODE                                   ██
  // ████████████████████████████████████████████████████████████████████████████
  // Prevents ChatGPT from changing tab title to prompts (privacy protection)

  let privacyModeEnabled = false;

  const isDevMode = () => {
    try {
      if (typeof DEV_MODE !== "undefined") return !!DEV_MODE;
    } catch {}
    try {
      return window.location.search.includes("debug=true");
    } catch {}
    return false;
  };

  // Initialize privacy mode from localStorage
  try {
    const stored = localStorage.getItem("sp_chatgpt_privacy_mode");
    privacyModeEnabled = stored === "1";
    if (privacyModeEnabled && isDevMode()) {
      devLog("🔒 [SuperPrompt] Privacy Mode: Tab titles will remain generic");
    }
  } catch (e) {
    devWarn("⚠️ [SuperPrompt] Failed to read privacy mode setting:", e);
  }

  // Listen for privacy mode changes from settings UI
  window.addEventListener("message", (event) => {
    if (event.data?.type === "sp-privacy-mode-changed") {
      privacyModeEnabled = event.data.enabled;
      if (isDevMode()) {
        devLog(
          privacyModeEnabled
            ? "🔒 [SuperPrompt] Privacy Mode ENABLED - Tab titles will stay generic"
            : "🔓 [SuperPrompt] Privacy Mode DISABLED - ChatGPT can change tab titles",
        );
      }
      // Reset title immediately if enabling privacy mode
      if (privacyModeEnabled && document.title !== "ChatGPT") {
        document.title = "ChatGPT";
      }
    }
  });

  // Intercept title changes using MutationObserver
  const titleElement = document.querySelector("title");
  if (titleElement) {
    const titleObserver = new MutationObserver(() => {
      if (privacyModeEnabled && document.title !== "ChatGPT") {
        document.title = "ChatGPT";
      }
    });

    titleObserver.observe(titleElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    devLog("🔒 [SuperPrompt] Privacy Mode: Title observer initialized");
  }

  // Also override the document.title setter for maximum protection
  const originalTitleDescriptor = Object.getOwnPropertyDescriptor(
    Document.prototype,
    "title",
  );
  if (originalTitleDescriptor) {
    Object.defineProperty(document, "title", {
      get: function () {
        try {
          return originalTitleDescriptor.get.call(this);
        } catch {
          return "";
        }
      },
      set: function (newTitle) {
        if (privacyModeEnabled && newTitle !== "ChatGPT") {
          // Silently ignore title changes when privacy mode is on
          try {
            originalTitleDescriptor.set.call(this, "ChatGPT");
          } catch {}
        } else {
          try {
            originalTitleDescriptor.set.call(this, newTitle);
          } catch {}
        }
      },
      configurable: true,
    });
    devLog("🔒 [SuperPrompt] Privacy Mode: Title setter override installed");
  }

  // ████████████████████████████████████████████████████████████████████████████
  // ██                    CUSTOM SCROLLBAR STYLING                           ██
  // ████████████████████████████████████████████████████████████████████████████
  // Apply dark scrollbar styling to ChatGPT interface
  (() => {
    const scrollbarStyle = document.createElement("style");
    scrollbarStyle.id = "sp-scrollbar-override";
    scrollbarStyle.textContent = `
      /* Webkit browsers (Chrome, Edge, Safari) */
      ::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }
      
      ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
      }
      
      ::-webkit-scrollbar-thumb {
        background: rgba(60, 60, 70, 0.8);
        border-radius: 6px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(70, 70, 80, 0.9);
        border-radius: 6px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }
      
      ::-webkit-scrollbar-thumb:active {
        background: rgba(80, 80, 90, 1);
      }
      
      /* Firefox */
      * {
        scrollbar-width: thin;
        scrollbar-color: rgba(60, 60, 70, 0.8) rgba(0, 0, 0, 0.1);
      }
    `;
    document.head.appendChild(scrollbarStyle);
    devLog("🎨 [SuperPrompt] Dark scrollbar styling applied");
  })();

  // ████████████████████████████████████████████████████████████████████████████
  // ██                    DEVTOOLS PERFORMANCE PROTECTION                    ██
  // ████████████████████████████████████████████████████████████████████████████
  // NOTE: DevTools Sources/Elements tabs are slow due to ChatGPT's own architecture:
  // - ChatGPT creates 1500+ setInterval calls that Chrome must track
  // - Complex React DOM with thousands of nodes to index
  // - This is inherent to ChatGPT's implementation, not our extension
  //
  // We pause our MutationObservers when DevTools is detected to minimize our impact.

  window._spDevToolsOpen = false;
  window._spCheckingDevTools = false;

  // ⏸️ EXTENSION PAUSE STATE - Can be toggled via Ctrl+Shift+P
  // When paused, all MutationObservers and intervals are disconnected
  window._spExtensionPaused = false;
  window._spObservers = []; // Track all observers for pause/resume
  window._spIntervals = []; // Track all intervals for pause/resume

  // Helper to register an observer for pause management
  window._spRegisterObserver = function (observer) {
    if (!window._spObservers.includes(observer)) {
      window._spObservers.push(observer);
    }
  };

  // Helper to register an interval for pause management
  window._spRegisterInterval = function (intervalId) {
    if (!window._spIntervals.includes(intervalId)) {
      window._spIntervals.push(intervalId);
    }
  };

  // Pause all extension activity
  window._spPauseExtension = function () {
    if (window._spExtensionPaused) return;
    window._spExtensionPaused = true;

    devLog("⏸️ [SuperPrompt] Extension PAUSED - All observers disconnected");

    // Disconnect all registered observers
    window._spObservers.forEach((obs) => {
      try {
        obs.disconnect();
      } catch (e) {
        devWarn("Failed to disconnect observer:", e);
      }
    });

    // Clear all registered intervals
    window._spIntervals.forEach((id) => {
      try {
        clearInterval(id);
      } catch (e) {
        devWarn("Failed to clear interval:", e);
      }
    });
  };

  // Resume all extension activity (requires page reload to reconnect observers)
  window._spResumeExtension = function () {
    if (!window._spExtensionPaused) return;
    window._spExtensionPaused = false;

    devLog(
      "▶️ [SuperPrompt] Extension RESUMED - Reload page to reconnect observers",
    );

    // Note: Observers cannot be reconnected without re-running initialization code
    // User should reload the page after resuming for full functionality
  };

  // Helper to create a MutationObserver that auto-pauses
  window._spCreateObserver = function (callback, options) {
    if (window._spExtensionPaused) {
      // If already paused, return a dummy observer that does nothing
      return { observe: () => {}, disconnect: () => {} };
    }

    const observer = new MutationObserver((...args) => {
      if (window._spExtensionPaused) return; // Skip if paused
      callback(...args);
    });

    // Register for pause management
    window._spRegisterObserver(observer);

    return observer;
  };

  // Helper to create an interval that auto-stops when paused
  window._spSetInterval = function (callback, delay) {
    if (window._spExtensionPaused) {
      return null; // Don't create intervals when paused
    }

    const intervalId = setInterval(() => {
      if (window._spExtensionPaused) return; // Skip if paused
      callback();
    }, delay);

    // Register for pause management
    window._spRegisterInterval(intervalId);

    return intervalId;
  };

  // Store original intervals before nuking
  window._spChatGPTIntervalsPaused = false;
  window._spPausedIntervalCount = 0;

  function detectDevTools() {
    if (window._spCheckingDevTools) return;
    window._spCheckingDevTools = true;

    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    const isOpen = widthThreshold || heightThreshold;

    if (isOpen !== window._spDevToolsOpen) {
      window._spDevToolsOpen = isOpen;
      // Only log in DEV_MODE to reduce production console noise
      if (DEV_MODE) {
        if (isOpen) {
          console.info(
            "⚠️ [SuperPrompt] DevTools detected - Type window._spAutoPauseChatGPT() to pause ChatGPT's 2700+ intervals",
          );
        } else {
          console.info(
            "✅ [SuperPrompt] DevTools closed - Reload page to restore ChatGPT intervals if paused",
          );
        }
      }
    }

    window._spCheckingDevTools = false;
  }

  // 🎯 SMART PAUSE - Only pause ChatGPT intervals (keep our extension working)
  window._spAutoPauseChatGPT = function () {
    if (window._spChatGPTIntervalsPaused) {
      console.warn(
        "⚠️ ChatGPT intervals already paused. Reload page to restore.",
      );
      return;
    }

    console.info(
      "⏸️ Pausing ChatGPT's intervals (keeping SuperPrompt active)...",
    );

    const maxId = (function () {
      let testId = setInterval(() => {}, 999999);
      clearInterval(testId);
      return testId;
    })();

    let cleared = 0;
    const ourIntervals = window._spIntervals || [];

    for (let i = 0; i < maxId; i++) {
      // Skip our own registered intervals
      if (!ourIntervals.includes(i)) {
        clearInterval(i);
        cleared++;
      }
    }

    window._spChatGPTIntervalsPaused = true;
    window._spPausedIntervalCount = cleared;

    console.info(
      `✅ Paused ${cleared} ChatGPT intervals. DevTools should be fast now!`,
    );
    console.info("💡 Reload page (F5) to restore ChatGPT functionality.");
    console.info("🎯 SuperPrompt extension remains active.");
  };

  // Check immediately and every 3 seconds
  detectDevTools();
  window._spSetInterval(detectDevTools, 3000);

  // 🔍 PERFORMANCE DIAGNOSTICS - Console command to analyze what's slowing down DevTools
  window._spDiagnostics = function () {
    console.log("🔍 ========== PERFORMANCE DIAGNOSTICS ==========");

    // Count all intervals on the page
    const intervalCount = (function () {
      let count = 0;
      let testId = setInterval(() => {}, 999999);
      count = testId;
      clearInterval(testId);
      return count;
    })();

    // Count all timeouts
    const timeoutCount = (function () {
      let count = 0;
      let testId = setTimeout(() => {}, 999999);
      count = testId;
      clearTimeout(testId);
      return count;
    })();

    console.log(`⏱️  Total setInterval IDs: ${intervalCount}`);
    console.log(`⏰ Total setTimeout IDs: ${timeoutCount}`);
    console.log(
      `⏸️  SuperPrompt Extension Paused: ${window._spExtensionPaused}`,
    );
    console.log(
      `🎯 ChatGPT Intervals Paused: ${
        window._spChatGPTIntervalsPaused || false
      }`,
    );
    console.log(
      `👁️  SuperPrompt Observers Registered: ${window._spObservers.length}`,
    );
    console.log(
      `⏲️  SuperPrompt Intervals Registered: ${window._spIntervals.length}`,
    );

    // Count DOM nodes
    const domNodes = document.querySelectorAll("*").length;
    console.log(`🌳 Total DOM nodes: ${domNodes}`);

    // Check for event listeners (rough estimate)
    const elementsWithListeners = document.querySelectorAll("*");
    let listenersEstimate = 0;
    elementsWithListeners.forEach((el) => {
      // Elements with onclick, onchange, etc attributes
      if (
        el.onclick ||
        el.onchange ||
        el.onkeydown ||
        el.onkeyup ||
        el.oninput
      ) {
        listenersEstimate++;
      }
    });
    console.log(`🎧 Elements with inline listeners: ${listenersEstimate}`);

    // Check for animations
    const animatedElements = document.querySelectorAll(
      "[style*='animation'], [class*='animate']",
    ).length;
    console.log(`🎬 Elements with animations: ${animatedElements}`);

    // Memory usage (if available)
    if (performance.memory) {
      const memMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(
        2,
      );
      const limitMB = (
        performance.memory.jsHeapSizeLimit /
        1024 /
        1024
      ).toFixed(2);
      console.log(
        `💾 Memory: ${memMB}MB / ${limitMB}MB (${(
          (memMB / limitMB) *
          100
        ).toFixed(1)}%)`,
      );
    }

    // Check React DevTools hooks
    const hasReactDevTools = !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    console.log(
      `⚛️  React DevTools: ${
        hasReactDevTools ? "ACTIVE (may slow down)" : "not active"
      }`,
    );

    // Check other extensions
    console.log(`🔌 Chrome extensions may also impact performance`);

    // Find heavy elements
    const heavySelectors = ["div", "span", "button", "svg", "path", "article"];
    console.log("\n📦 HEAVY ELEMENTS:");
    heavySelectors.forEach((sel) => {
      try {
        const count = document.querySelectorAll(sel).length;
        if (count > 500) {
          console.log(`  ${sel}: ${count} elements`);
        }
      } catch (e) {}
    });

    // SuperPrompt specific elements
    const spElements = document.querySelectorAll(
      '[data-superprompt], [class*="sp-"], [class*="superprompt"]',
    ).length;
    console.log(`🎯 SuperPrompt elements: ${spElements}`);

    // React fiber nodes (ChatGPT specific)
    const reactFiber = document.querySelectorAll("[data-reactid]").length;
    console.log(`⚛️  React elements: ${reactFiber}`);

    console.log("\n💡 RECOMMENDATIONS:");
    if (intervalCount > 100) {
      console.log(`  🔥 CRITICAL: ${intervalCount} intervals active!`);
    }
    if (timeoutCount > 1000) {
      console.log(`  ⚠️  ${timeoutCount} timeouts scheduled!`);
    }
    if (domNodes > 10000) {
      console.log(`  ⚠️  DOM is very large (${domNodes} nodes)`);
    }
    if (hasReactDevTools) {
      console.log(`  💡 Disable React DevTools extension to speed up DevTools`);
    }
    if (
      performance.memory &&
      performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit >
        0.8
    ) {
      console.log(
        `  ⚠️  High memory usage (${(
          (performance.memory.usedJSHeapSize /
            performance.memory.jsHeapSizeLimit) *
          100
        ).toFixed(1)}%)`,
      );
    }

    console.log("\n🛠️  AVAILABLE COMMANDS:");
    console.log(
      "  window._spDiagnostics()          - Show this diagnostic info",
    );
    console.log(
      "  window._spDeepFreeze()           - ⭐ NUCLEAR: Stop EVERYTHING (intervals, observers, animations)",
    );
    console.log(
      "  window._spMeasureDevTools()      - 🔬 Measure actual DevTools performance",
    );
    console.log(
      "  window._spTestOtherSite()        - 🎯 Test if problem is ChatGPT-specific",
    );
    console.log(
      "  window._spAutoPauseChatGPT()     - Pause ChatGPT intervals only",
    );
    console.log(
      "  window._spDisableReactDevTools() - Disable React DevTools hooks",
    );
    console.log(
      "\n💡 TIP: Try window._spMeasureDevTools() to see if it's actually slow or just feels slow",
    );
    console.log("=".repeat(70));
  };

  // 💣 NUCLEAR OPTION - Clear ALL intervals on the page (use with caution!)
  window._spNukeAllIntervals = function () {
    console.warn(
      "💣 NUKING ALL INTERVALS - This will break ChatGPT functionality!",
    );
    const maxId = (function () {
      let testId = setInterval(() => {}, 999999);
      clearInterval(testId);
      return testId;
    })();

    let cleared = 0;
    for (let i = 0; i < maxId; i++) {
      clearInterval(i);
      cleared++;
    }
    console.log(
      `💥 Cleared ${cleared} intervals. Reload page to restore ChatGPT.`,
    );
  };

  // 💣 DEEP FREEZE - Stop EVERYTHING for maximum DevTools speed
  window._spDeepFreeze = function () {
    console.warn("💣 DEEP FREEZE ACTIVATED - Stopping ALL activity on page!");

    let stats = {
      intervals: 0,
      timeouts: 0,
      observers: 0,
      animations: 0,
      reactHooks: false,
    };

    // 1. Clear ALL intervals
    const maxIntervalId = (function () {
      let testId = setInterval(() => {}, 999999);
      clearInterval(testId);
      return testId;
    })();
    for (let i = 0; i < maxIntervalId; i++) {
      clearInterval(i);
      stats.intervals++;
    }

    // 2. Clear ALL timeouts
    const maxTimeoutId = (function () {
      let testId = setTimeout(() => {}, 999999);
      clearTimeout(testId);
      return testId;
    })();
    for (let i = 0; i < maxTimeoutId; i++) {
      clearTimeout(i);
      stats.timeouts++;
    }

    // 3. Disconnect ALL MutationObservers globally
    const originalObserve = MutationObserver.prototype.observe;
    MutationObserver.prototype.observe = function () {
      console.log("🚫 MutationObserver.observe() blocked by Deep Freeze");
    };
    stats.observers = window._spObservers.length;
    window._spObservers.forEach((obs) => {
      try {
        obs.disconnect();
      } catch (e) {}
    });

    // 4. Stop all CSS animations
    const style = document.createElement("style");
    style.id = "sp-deep-freeze-style";
    style.textContent =
      "* { animation: none !important; transition: none !important; }";
    document.head.appendChild(style);
    stats.animations = document.querySelectorAll(
      "[style*='animation'], [class*='animate']",
    ).length;

    // 5. Disable React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = function () {};
      stats.reactHooks = true;
    }

    // 6. Block requestAnimationFrame
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function () {
      return 0; // Return dummy ID
    };

    console.log("❄️  DEEP FREEZE COMPLETE:");
    console.log(`   ⏱️  Cleared ${stats.intervals} intervals`);
    console.log(`   ⏰ Cleared ${stats.timeouts} timeouts`);
    console.log(`   👁️  Disconnected ${stats.observers} observers`);
    console.log(`   🎬 Disabled ${stats.animations} animations`);
    console.log(
      `   ⚛️  React DevTools: ${stats.reactHooks ? "disabled" : "not found"}`,
    );
    console.log(`   🖼️  Blocked requestAnimationFrame`);
    console.log("\n✅ DevTools should be EXTREMELY fast now!");
    console.log("🔄 Press F5 to reload and restore all functionality.");

    window._spDeepFrozen = true;
  };

  // Disable React DevTools specifically
  window._spDisableReactDevTools = function () {
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = function () {};
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.supportsFiber = false;
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers = new Map();
      console.info("✅ React DevTools disabled");
    } else {
      console.info("ℹ️  React DevTools not found");
    }
  };

  // 🔍 Performance measurement - Measure actual DevTools responsiveness
  window._spMeasureDevTools = function () {
    console.log("🔬 ========== DEVTOOLS RESPONSIVENESS TEST ==========");
    console.log("Measuring time to select 1000 elements...\n");

    const tests = [
      { name: "querySelector", fn: () => document.querySelector("div") },
      {
        name: "querySelectorAll (100)",
        fn: () => document.querySelectorAll("div").length,
      },
      { name: "getElementById", fn: () => document.getElementById("root") },
      {
        name: "getElementsByTagName",
        fn: () => document.getElementsByTagName("div").length,
      },
    ];

    tests.forEach((test) => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        test.fn();
      }
      const end = performance.now();
      const time = (end - start).toFixed(2);
      console.log(
        `  ${test.name}: ${time}ms (${(time / 1000).toFixed(2)}ms per call)`,
      );
    });

    console.log("\n💡 INTERPRETATION:");
    console.log("  < 100ms total = Fast");
    console.log("  100-500ms = Acceptable");
    console.log("  > 500ms = Slow (investigate further)");
    console.log("\n🤔 IF STILL SLOW AFTER DEEP FREEZE:");
    console.log("  1. Test in Incognito mode (Ctrl+Shift+N)");
    console.log("  2. Disable ALL other Chrome extensions");
    console.log("  3. Check Chrome DevTools Settings → Experiments");
    console.log("  4. Try different Chrome profile");
    console.log("  5. Update Chrome to latest version");
    console.log("  6. Check Task Manager - is Chrome using too much CPU/RAM?");
    console.log("\n💡 Known Chrome DevTools slowness causes:");
    console.log("  - 'Enable CSS source maps' (Settings → Sources)");
    console.log("  - 'Enable JavaScript source maps' (Settings → Sources)");
    console.log("  - Too many breakpoints");
    console.log("  - Network throttling enabled");
    console.log("  - Paint flashing enabled");
    console.log("  - Other extensions (especially ad blockers, privacy tools)");
    console.log("========================================");
  };

  // 🎯 Quick test: Is it ChatGPT-specific or Chrome-wide?
  window._spTestOtherSite = function () {
    console.log("💡 Open a simple site (like example.com) in a new tab");
    console.log("   and test if DevTools is fast there.");
    console.log("\n   If it IS fast on other sites:");
    console.log("     → Problem is ChatGPT-specific (likely unfixable)");
    console.log("\n   If it's ALSO slow on other sites:");
    console.log("     → Problem is Chrome/System-wide:");
    console.log("       • Try Incognito mode");
    console.log("       • Disable all extensions");
    console.log("       • Check Chrome DevTools settings");
    console.log("       • Restart Chrome completely");
    window.open("https://example.com", "_blank");
  };

  // Global state for floating menu (to check when creating Notes tab)
  let isFloatingMenuOpen = false;

  // ████████████████████████████████████████████████████████████████████████████
  // ██                      SUPERPROMPT CHATGPT LISTENER                     ██
  // ██                         ARCHITECTURAL OVERVIEW                        ██
  // ██                                                                      ██
  // ██  ⚠️  WARNING: DO NOT EDIT THIS FILE FOR FEATURE DEVELOPMENT!          ██
  // ██      This file serves as FALLBACK CODE ONLY for stability.           ██
  // ██      Always edit modules in src/injected/modules/ instead!           ██
  // ██      See: MODULE_DEVELOPMENT_GUIDE.md for instructions               ██
  // ██                                                                      ██
  // ████████████████████████████████████████████████████████████████████████████
  // ██                                                                      ██
  // ██  This 11,700+ line file handles all ChatGPT page enhancements.      ██
  // ██  It's organized into distinct functional sections:                   ██
  // ██                                                                      ██
  // ██  🏗️  CORE INFRASTRUCTURE (Lines 1-600)                               ██
  // ██     Navigation safety, i18n, utilities, button components            ██
  // ██                                                                      ██
  // ██  📝 NOTES SYSTEM (Lines 600-1300)                                    ██
  // ██     Note tabs, sidebar editor, IndexedDB storage management          ██
  // ██                                                                      ██
  // ██  📊 MESSAGE OVERLAYS (Lines 1300-2000)                               ██
  // ██     Character/word counters on ChatGPT assistant messages            ██
  // ██                                                                      ██
  // ██  📐 CONVERSATION WIDTH → MOVED TO chatgpt-convo-width.js            ██
  // ██     Sidebar width control, smooth animations, CSS management         ██
  // ██                                                                      ██
  // ██  ⚡ QUICK ACCESS MENU (Lines 3500-5000)                               ██
  // ██     Slash command system, prompt search & insertion                  ██
  // ██                                                                      ██
  // ██  👤 USER DETECTION (Lines 5000-6500)                                 ██
  // ██     ChatGPT account detection, backend user registration             ██
  // ██                                                                      ██
  // ██  ⌨️  EVENT LISTENERS (Lines 6500-8500)                                ██
  // ██     Global keyboard handlers, navigation monitoring                  ██
  // ██                                                                      ██
  // ██  🌳 VAULT SYSTEM (Lines 8500-11700)                                  ██
  // ██     Main vault interface, tree rendering, Shadow DOM isolation      ██
  // ██                                                                      ██
  // ████████████████████████████████████████████████████████████████████████████

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                         MODULE LOADING SYSTEM                          ██
  // ██                                                                        ██
  // ██  Phase 1 refactoring: Wait for modules injected by content script      ██
  // ██  Fallback to embedded code if modules don't load                       ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Module loading state
  let modulesLoaded = false;
  let moduleCheckAttempts = 0;
  const MAX_MODULE_CHECK_ATTEMPTS = 20; // Check for 10 seconds (20 * 500ms)

  // Track which modules have loaded successfully
  const loadedModules = {
    coreUtils: false,
    i18n: false,
    promptManager: false,
    uiComponents: false,
    storageManager: false,
    notesManager: false,
    messageOverlays: false,
    quickAccessMenu: false,
    conversationStyling: false,
  }; // Wait for modules to be available (injected by content script)
  function waitForModules() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        moduleCheckAttempts++;

        // Check if modules are available
        const coreUtilsAvailable =
          typeof window.SuperPromptCoreUtils !== "undefined";
        const i18nAvailable = typeof window.SuperPromptI18n !== "undefined";
        const promptManagerAvailable =
          typeof window.SuperPromptPromptManager !== "undefined";
        const uiComponentsAvailable =
          typeof window.SuperPromptUIComponents !== "undefined";
        const storageManagerAvailable =
          typeof window.SuperPromptStorageManager !== "undefined";
        const notesManagerAvailable =
          typeof window.SuperPromptNotesManager !== "undefined";
        const messageOverlaysAvailable =
          typeof window.SuperPromptMessageOverlays !== "undefined";
        const quickAccessMenuAvailable =
          typeof window.SuperPromptQuickAccessMenu !== "undefined";
        const conversationStylingAvailable =
          typeof window.SuperPromptConversationStyling !== "undefined";

        // Check if CSS is loaded (simple check for SuperPrompt specific styles)
        const cssLoaded = checkCSSLoaded();

        if (coreUtilsAvailable) {
          devLog("✅ [SP-ModuleLoader] Core utilities module detected");
          loadedModules.coreUtils = true;
        }

        if (i18nAvailable) {
          devLog("✅ [SP-ModuleLoader] i18n module detected");
          loadedModules.i18n = true;
        }

        if (promptManagerAvailable) {
          devLog("✅ [SP-ModuleLoader] Prompt manager module detected");
          loadedModules.promptManager = true;
        }

        if (uiComponentsAvailable) {
          devLog("✅ [SP-ModuleLoader] UI components module detected");
          loadedModules.uiComponents = true;
        }

        if (storageManagerAvailable) {
          devLog("✅ [SP-ModuleLoader] Storage manager module detected");
          loadedModules.storageManager = true;
        }

        if (notesManagerAvailable) {
          devLog("✅ [SP-ModuleLoader] Notes manager module detected");
          loadedModules.notesManager = true;
        }

        if (messageOverlaysAvailable) {
          devLog("✅ [SP-ModuleLoader] Message overlays module detected");
          loadedModules.messageOverlays = true;
        }

        if (quickAccessMenuAvailable) {
          devLog("✅ [SP-ModuleLoader] Quick access menu module detected");
          loadedModules.quickAccessMenu = true;
        }

        if (conversationStylingAvailable) {
          devLog("✅ [SP-ModuleLoader] Conversation styling module detected");
          loadedModules.conversationStyling = true;
        }

        if (cssLoaded) {
          devLog("✅ [SP-ModuleLoader] CSS styles loaded");
        } else {
          devLog("⏳ [SP-ModuleLoader] Waiting for CSS styles...");
        }

        // Success if we have all modules AND CSS, or we've tried long enough
        const success =
          coreUtilsAvailable &&
          i18nAvailable &&
          promptManagerAvailable &&
          uiComponentsAvailable &&
          storageManagerAvailable &&
          notesManagerAvailable &&
          messageOverlaysAvailable &&
          quickAccessMenuAvailable &&
          cssLoaded;
        const timeout = moduleCheckAttempts >= MAX_MODULE_CHECK_ATTEMPTS;

        if (success) {
          clearInterval(checkInterval);
          devLog(
            "✅ [SP-ModuleLoader] All core modules (coreUtils, i18n, promptManager, uiComponents, storageManager, notesManager, messageOverlays, quickAccessMenu) and CSS available",
          );
          modulesLoaded = true;
          resolve(true);
        } else if (timeout) {
          clearInterval(checkInterval);
          devWarn(
            "⚠️ [SP-ModuleLoader] Timeout waiting for modules/CSS, using fallback",
          );
          modulesLoaded = true; // Proceed with fallback
          resolve(false);
        }
      }, 500); // Check every 500ms
    });
  }

  // Check if CSS is properly loaded
  function checkCSSLoaded() {
    try {
      // Check multiple sources for CSS ready state
      const explicitFlag = window._superPromptCSSLoaded;
      const injectedFlag = window._superPromptCSSInjected;
      const shadowRootExists =
        document.getElementById("superprompt-root")?.shadowRoot;

      if (explicitFlag) {
        return true;
      }

      // If CSS was injected but notification not received, check shadow DOM
      if (injectedFlag && shadowRootExists) {
        const cssLinks = shadowRootExists.querySelectorAll(
          'link[rel="stylesheet"][data-superprompt-style]',
        );
        if (cssLinks.length > 0) {
          // Mark as loaded if we find CSS in shadow DOM
          window._superPromptCSSLoaded = true;
          devLog("🎨 [SP-CSS] CSS detected in shadow DOM, marking as loaded");
          return true;
        }
      }

      // Fallback timeout - if it's been more than 10 seconds since page load
      const pageLoadTime =
        performance.timing?.loadEventEnd || Date.now() - 10000;
      const timeSinceLoad = Date.now() - pageLoadTime;
      const timeoutFallback = timeSinceLoad > 10000;

      if (timeoutFallback && !window._superPromptCSSLoaded) {
        devWarn(
          "[SP-CSS] CSS load timeout - assuming loaded (fallback after 10s)",
        );
        window._superPromptCSSLoaded = true;
        return true;
      }

      return false;
    } catch (error) {
      devWarn("[SP-CSS] Error checking CSS load status:", error);
      return true; // Fallback to assuming loaded to avoid blocking
    }
  }

  // Load core modules
  async function loadCoreModules() {
    if (modulesLoaded) {
      return;
    }

    const debugMode = window.location.search.includes("debug=true");

    if (debugMode) {
      devLog("[SP-ModuleLoader] Waiting for core modules to be injected...");
    }

    try {
      const success = await waitForModules();
      const successCount = Object.values(loadedModules).filter(Boolean).length;

      if (debugMode) {
        devLog(
          `[SP-ModuleLoader] Module loading complete: ${successCount}/2 modules available`,
        );
      }

      if (success) {
        if (debugMode) {
          devLog("✅ [SP-ModuleLoader] Modular architecture active");
        }
      } else {
        devLog("⚠️ [SP-ModuleLoader] Using embedded fallback code");
      }
    } catch (error) {
      devError("[SP-ModuleLoader] Error during module loading:", error);
      modulesLoaded = true; // Proceed with fallback
    }
  }

  // Initialize module loading early
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadCoreModules);
  } else {
    loadCoreModules();
  }

  // Also try on window load as fallback
  window.addEventListener("load", () => {
    if (!modulesLoaded) {
      devLog("[SP-ModuleLoader] Retrying module check on window.load");
      loadCoreModules();
    }
  });

  // Listen for CSS load notification from content script
  window.addEventListener("message", (event) => {
    if (
      event.data.type === "SUPERPROMPT_CSS_LOADED" &&
      event.data.source === "content-script"
    ) {
      window._superPromptCSSLoaded = true;
      devLog("🎨 [SP-CSS] Received CSS load notification from content script");
    }
  });

  // Handle access token requests from content script
  window.addEventListener("message", async (event) => {
    if (
      event.data?.type === "sp-request-page-access-token" &&
      event.data?.source === "superprompt-content"
    ) {
      devLog("🔑 [PAGE] Access token request received from content script");
      try {
        // Fetch session to get access token
        const response = await fetch("https://chatgpt.com/api/auth/session", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const accessToken = data.accessToken;

          if (accessToken) {
            devLog(
              `🔑 [PAGE] Got access token from session, length: ${accessToken.length}`,
            );
          } else {
            devLog("🔑 [PAGE] No accessToken in session response");
            devLog("🔑 [PAGE] Session response data:", data);
          }

          // Send token back to content script
          window.postMessage(
            {
              type: "sp-page-access-token-response",
              source: "superprompt-page",
              accessToken: accessToken || null,
            },
            "*",
          );
        } else {
          devError(
            "🔑 [PAGE] Session API request failed:",
            response.status,
            response.statusText,
          );
          window.postMessage(
            {
              type: "sp-page-access-token-response",
              source: "superprompt-page",
              accessToken: null,
            },
            "*",
          );
        }
      } catch (error) {
        devError("🔑 [PAGE] Error fetching access token:", error);
        window.postMessage(
          {
            type: "sp-page-access-token-response",
            source: "superprompt-page",
            accessToken: null,
          },
          "*",
        );
      }
    }
  });

  // Also check if CSS notification was already sent before listener was registered
  if (window._superPromptCSSLoaded) {
    devLog(
      "🎨 [SP-CSS] CSS already loaded (flag was set before listener registration)",
    );
  }

  // ████████████████████████████████████████████████████████████████████████████
  // ██          USER DETECTION - NOW HANDLED BY userDetection.js MODULE       ██
  // ████████████████████████████████████████████████████████████████████████████
  // Legacy ChatGPT user info handler has been removed. User detection and
  // registration is now handled by modules/userDetection.js which:
  //   - Uses multi-strategy detection (session API, backend-api/me, localStorage)
  //   - Posts 'chatgpt-user-detected' message to content script
  //   - Handles retries, debouncing, and error recovery
  //   - Integrates with Railway backend registration
  //
  // This eliminates duplicate network calls to /api/auth/session and
  // /backend-api/me, and prevents conflicting user payloads.
  // ████████████████████████████████████████████████████████████████████████████

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                          CORE INFRASTRUCTURE                           ██
  // ██                                                                        ██
  // ██  Navigation safety, global utilities, i18n system, button components  ██
  // ██  Lines: 1-600                                                          ██
  // ██████████████████████████████████████████████████████████████████████████████

  // 🚨 SMART DISABLE: Keep critical features but prevent DOM conflicts during navigation
  const DISABLE_CONVERSATION_WIDTH = true; // Conversation width moved to chatgpt-convo-width.js
  const DISABLE_MUTATION_OBSERVERS = false; // ✅ Keep observers for critical features!
  const DISABLE_EVENT_LISTENERS = false; // ✅ Keep slash handler!

  // Quick access menu state
  let showFavoritesOnly = false;

  // Pending prompt logging - wait for actual message to appear before logging
  let pendingPromptToLog = null;

  // ████████████████████████████████████████████████████████████████████████████
  // ██              NAVIGATION SAFETY - NOW HANDLED BY MODULES               ██
  // ████████████████████████████████████████████████████████████████████████████
  // Navigation safety functions (detectNewChatCreation, onNavigationChange,
  // isSafeToOperate) and history API hooks are now managed by:
  //   - modules/coreUtils.js: Core safety checks and detection logic
  //   - modules/eventManager.js: URL watching, history hooks, navigation events
  //
  // These modules prevent duplicate navigation triggers and centralize state.
  // Use window.SuperPromptCoreUtils.isSafeToOperate() for safety checks.
  // ████████████████████████████████████████████████████████████████████████████

  // Try initial injection shortly after load
  setTimeout(ensurePrintButton, 1000);

  // MutationObserver to watch for header DOM changes (React re-renders)
  // This ensures our buttons stay visible even when ChatGPT updates the header
  let headerObserver = null;
  let buttonCheckInterval = null;

  function startHeaderObserver() {
    // Stop existing observer if any
    if (headerObserver) {
      headerObserver.disconnect();
    }
    if (buttonCheckInterval) {
      clearInterval(buttonCheckInterval);
    }

    const headerActions = document.querySelector(
      "#conversation-header-actions",
    );
    if (!headerActions) {
      // Header not ready yet, try again later
      setTimeout(startHeaderObserver, 500);
      return;
    }

    // Use MutationObserver for immediate detection
    headerObserver = new MutationObserver((mutations) => {
      // Check if our buttons are still present
      const hasPreviewBtn = headerActions.querySelector(
        "[data-sp-preview-btn]",
      );
      const hasPrintBtn = headerActions.querySelector("[data-sp-print-btn]");

      // If either button is missing, re-inject
      if (!hasPreviewBtn || !hasPrintBtn) {
        ensurePrintButton();
      }
    });

    // Observe the header for changes to its children
    headerObserver.observe(headerActions, {
      childList: true,
      subtree: true,
    });

    // Backup polling - emergency fallback only (MutationObserver handles 99% of cases)
    // PERFORMANCE: Changed from 2s to 10s (observer handles instant detection)
    buttonCheckInterval = setInterval(() => {
      const currentHeader = document.querySelector(
        "#conversation-header-actions",
      );
      if (!currentHeader) return;

      const hasPreviewBtn = currentHeader.querySelector(
        "[data-sp-preview-btn]",
      );
      const hasPrintBtn = currentHeader.querySelector("[data-sp-print-btn]");

      if (!hasPreviewBtn || !hasPrintBtn) {
        ensurePrintButton();
      }
    }, 10000); // Emergency fallback only - MutationObserver handles instant detection
  }

  // Start observing after initial injection
  setTimeout(startHeaderObserver, 1500);

  // --- Minimal i18n helper for injected context (no bundler/module) ---
  function spGetLang() {
    try {
      const l = localStorage.getItem("superprompt-language");
      if (l === "nl") return "nl";
      if (l === "fr") return "fr";
      return "en";
    } catch {}
    try {
      const nav = (navigator.language || "en").toLowerCase();
      if (nav.startsWith("nl")) return "nl";
      if (nav.startsWith("fr")) return "fr";
      return "en";
    } catch {}
    return "en";
  }
  const spI18n = {
    en: {
      notes: "Notes",
      addNote: "Add Note",
      editNote: "Edit Note",
      title: "Title",
      content: "Content",
      searchChats: "Search chats...",
      clearSearch: "Clear search",
      chatCategories: "Chat Categories",
      readOnly: "read-only",
      collapseAll: "Collapse All",
      uncollapseAll: "Uncollapse All",
      sidebarSettings: "Sidebar settings",
      showFavWhenEmpty: "Show Favorites when empty",
      showArchivedWhenEmpty: "Show Archived when empty",
      unassignedMaxHeightLabel: "Unassigned max height (px, 0 = no limit)",
      unassignedLabel: (n) => `Unassigned (${n})`,
      enterNoteTitle: "Enter note title...",
      writeYourNote: "Write your note here...",
      autoSaved: "Auto-saved",
      cancel: "Cancel",
      save: "Save",
      update: "Update",
      loadingConversation: "Loading conversation…",
      restoringLargePrev: (s) =>
        `Restoring large conversation (~${s}s previously)…`,
      elapsedSuffix: (s) => `${s}s elapsed`,
      characters: (c) => `${c} characters`,
      allPrompts: "All Prompts",
      favoritePrompts: "Favorite Prompts",
      addNewPrompt: "+ Add New Prompt",
      searchPrompts: "Search prompts...",
      noPrompts: "No prompts found",
      showAllPrompts: "Show all prompts",
      showOnlyFavorites: "Show only favorites",
      noFavoritePromptsFor: (term) => `No favorite prompts found for "${term}"`,
      noFavoritePrompts: "No favorite prompts found",
      noPromptsFor: (term) => `No prompts found for "${term}"`,
      noSavedPrompts: "No saved prompts found",
      print: "Print",
      printConversation: "Print conversation",
      printLoading: "Preparing print page...",
      printFailed: "Failed to prepare print page. Please try again.",
      preview: "Preview",
      previewConversation: "Preview conversation",
      extractPrompts: "Extract Prompts",
      exportConversations: "Export Conversations",
      proBadge: "Pro",
      // Sidebar Toggle
      switchToDefaultView: "Switch to default view",
      switchToWideView: "Switch to alternative view",
      currentWide: "Current: Wide",
      currentDefault: "Current: Default",
    },
    nl: {
      notes: "Notities",
      addNote: "Notitie toevoegen",
      editNote: "Notitie bewerken",
      title: "Titel",
      content: "Inhoud",
      searchChats: "Zoek chats...",
      clearSearch: "Zoekopdracht wissen",
      chatCategories: "Chatcategorieën",
      readOnly: "alleen-lezen",
      collapseAll: "Alles inklappen",
      uncollapseAll: "Alles uitklappen",
      sidebarSettings: "Zijbalkinstellingen",
      showFavWhenEmpty: "Toon favorieten wanneer leeg",
      showArchivedWhenEmpty: "Toon gearchiveerd wanneer leeg",
      unassignedMaxHeightLabel:
        "Niet-toegewezen max-hoogte (px, 0 = geen limiet)",
      unassignedLabel: (n) => `Niet-toegewezen (${n})`,
      enterNoteTitle: "Voer een notitietitel in...",
      writeYourNote: "Schrijf hier je notitie...",
      autoSaved: "Automatisch opgeslagen",
      cancel: "Annuleren",
      save: "Opslaan",
      update: "Bijwerken",
      loadingConversation: "Gesprek laden…",
      restoringLargePrev: (s) => `Groot gesprek herstellen (~${s}s eerder)…`,
      elapsedSuffix: (s) => `${s}s verlopen`,
      characters: (c) => `${c} tekens`,
      allPrompts: "Alle Prompts",
      favoritePrompts: "Favoriete Prompts",
      addNewPrompt: "+ Nieuwe Prompt Toevoegen",
      searchPrompts: "Zoek prompts...",
      noPrompts: "Geen prompts gevonden",
      showAllPrompts: "Toon alle prompts",
      showOnlyFavorites: "Toon alleen favorieten",
      noFavoritePromptsFor: (term) =>
        `Geen favoriete prompts gevonden voor "${term}"`,
      noFavoritePrompts: "Geen favoriete prompts gevonden",
      noPromptsFor: (term) => `Geen prompts gevonden voor "${term}"`,
      noSavedPrompts: "Geen opgeslagen prompts gevonden",
      print: "Afdrukken",
      printConversation: "Conversatie afdrukken",
      printLoading: "Print pagina voorbereiden...",
      printFailed:
        "Het voorbereiden van de printpagina is mislukt. Probeer het opnieuw.",
      preview: "Voorvertoning",
      previewConversation: "Conversatie bekijken",
      extractPrompts: "Prompts extraheren",
      exportConversations: "Conversaties exporteren",
      proBadge: "Pro",
      // Sidebar Toggle
      switchToDefaultView: "Naar standaardweergave",
      switchToWideView: "Naar alternatieve weergave",
      currentWide: "Huidige: Breed",
      currentDefault: "Huidige: Standaard",
    },
    fr: {
      notes: "Notes",
      addNote: "Ajouter une note",
      editNote: "Modifier la note",
      title: "Titre",
      content: "Contenu",
      searchChats: "Rechercher des conversations...",
      clearSearch: "Effacer la recherche",
      chatCategories: "Catégories de conversation",
      readOnly: "lecture seule",
      collapseAll: "Tout réduire",
      uncollapseAll: "Tout déplier",
      sidebarSettings: "Paramètres de la barre latérale",
      showFavWhenEmpty: "Afficher les favoris quand vide",
      showArchivedWhenEmpty: "Afficher les archivés quand vide",
      unassignedMaxHeightLabel:
        "Hauteur max non assignée (px, 0 = sans limite)",
      unassignedLabel: (n) => `Non assigné (${n})`,
      enterNoteTitle: "Entrez un titre de note...",
      writeYourNote: "Écrivez votre note ici...",
      autoSaved: "Sauvegarde automatique",
      cancel: "Annuler",
      save: "Enregistrer",
      update: "Mettre à jour",
      loadingConversation: "Chargement de la conversation…",
      restoringLargePrev: (s) =>
        `Restauration d'une grande conversation (~${s}s précédemment)…`,
      elapsedSuffix: (s) => `${s}s écoulé`,
      characters: (c) => `${c} caractères`,
      allPrompts: "Tous les Prompts",
      favoritePrompts: "Prompts Favoris",
      addNewPrompt: "+ Ajouter un Nouveau Prompt",
      searchPrompts: "Rechercher des prompts...",
      noPrompts: "Aucun prompt trouvé",
      showAllPrompts: "Afficher tous les prompts",
      showOnlyFavorites: "Afficher uniquement les favoris",
      noFavoritePromptsFor: (term) =>
        `Aucun prompt favori trouvé pour "${term}"`,
      noFavoritePrompts: "Aucun prompt favori trouvé",
      noPromptsFor: (term) => `Aucun prompt trouvé pour "${term}"`,
      noSavedPrompts: "Aucun prompt enregistré trouvé",
      print: "Imprimer",
      printConversation: "Imprimer la conversation",
      printLoading: "Préparation de la page d'impression...",
      printFailed:
        "Échec de la préparation de la page d'impression. Veuillez réessayer.",
      preview: "Aperçu",
      previewConversation: "Aperçu de la conversation",
      extractPrompts: "Extraire les prompts",
      exportConversations: "Exporter les conversations",
      proBadge: "Pro",
      // Sidebar Toggle
      switchToDefaultView: "Passer à la vue par défaut",
      switchToWideView: "Passer à la vue alternative",
      currentWide: "Actuel: Large",
      currentDefault: "Actuel: Par défaut",
    },
  };
  function t(key, arg) {
    const lang = spGetLang();
    const dict = spI18n[lang] || spI18n.en;
    const v = dict[key];
    if (typeof v === "function") return v(arg);
    return v || key;
  }
  let lastPromptText = ""; // Cache voor de laatste prompt
  const TOGGLE_KEY = "sp_alt_view_on";
  const DESIRED_WIDTH = 350; // px
  const DEFAULT_WIDTH_GUESS = 260; // px, used for smooth animate-off
  const ANIM_DURATION_MS = 260; // duration for smooth transitions

  // Import GenericButton utility
  const { createGenericButton, BUTTON_VARIANTS } = (() => {
    // Inline the createGenericButton function since we can't use ES6 imports here
    const BUTTON_VARIANTS = {
      primary: "primary",
      secondary: "secondary",
      danger: "danger",
      success: "success",
      warning: "warning",
    };

    const BUTTON_SIZES = {
      sm: "sm",
      md: "md",
      lg: "lg",
    };

    function createGenericButton(options = {}) {
      const {
        text = "",
        variant = BUTTON_VARIANTS.primary,
        size = BUTTON_SIZES.md,
        disabled = false,
        loading = false,
        icon = null,
        iconPosition = "left",
        fullWidth = false,
        onClick = null,
        type = "button",
        customStyles = {},
      } = options;

      // Get accent color from localStorage for primary buttons
      const accentColor = getAccentColorForButtons();

      const button = document.createElement("button");
      button.type = type;
      button.disabled = disabled || loading;

      const baseStyles = {
        transition: "all 0.2s ease",
        cursor: "pointer",
        borderRadius: "8px",
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: "500",
        outline: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        position: "relative",
        overflow: "hidden",
        border: "none",
        boxSizing: "border-box",
      };

      const variantStyles = {
        [BUTTON_VARIANTS.primary]: {
          background: accentColor,
          color: "white",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        },
        [BUTTON_VARIANTS.secondary]: {
          border: "1px solid var(--color-border, #444)",
          background: "var(--color-surface-primary, #1a1a1a)",
          color: "var(--color-text-secondary, #ccc)",
        },
      };

      const sizeStyles = {
        [BUTTON_SIZES.md]: { padding: "10px 20px", fontSize: "14px" },
      };

      const hoverStyles = {
        [BUTTON_VARIANTS.primary]: {
          transform: "translateY(-2px)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        },
        [BUTTON_VARIANTS.secondary]: {
          background: "var(--color-surface-hover, rgba(255, 255, 255, 0.1))",
          color: "var(--color-text-primary, #fff)",
          transform: "translateY(-1px)",
        },
      };

      const allStyles = {
        ...baseStyles,
        ...(variantStyles[variant] || variantStyles[BUTTON_VARIANTS.primary]),
        ...(sizeStyles[size] || sizeStyles[BUTTON_SIZES.md]),
        width: fullWidth ? "100%" : "auto",
        opacity: disabled || loading ? "0.6" : "1",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        ...customStyles,
      };

      Object.assign(button.style, allStyles);

      const contentContainer = document.createElement("div");
      contentContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        opacity: ${loading ? "0.7" : "1"};
      `;

      if (loading) {
        const spinner = document.createElement("div");
        spinner.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        `;
        spinner.style.cssText =
          "animation: generic-button-spin 1s linear infinite; display: flex; align-items: center;";
        contentContainer.appendChild(spinner);
      }

      if (!loading && icon && iconPosition === "left") {
        const iconElement = document.createElement("span");
        iconElement.innerHTML = icon;
        iconElement.style.cssText =
          "display: flex; align-items: center; justify-content: center;";
        contentContainer.appendChild(iconElement);
      }

      if (text) {
        const textElement = document.createElement("span");
        textElement.textContent = text;
        contentContainer.appendChild(textElement);
      }

      if (!loading && icon && iconPosition === "right") {
        const iconElement = document.createElement("span");
        iconElement.innerHTML = icon;
        iconElement.style.cssText =
          "display: flex; align-items: center; justify-content: center;";
        contentContainer.appendChild(iconElement);
      }

      button.appendChild(contentContainer);

      if (!disabled && !loading) {
        button.addEventListener("mouseenter", () => {
          Object.assign(button.style, hoverStyles[variant] || {});
        });

        button.addEventListener("mouseleave", () => {
          Object.assign(button.style, allStyles);
        });

        button.addEventListener("mousedown", () => {
          button.style.transform = "scale(0.98)";
        });

        button.addEventListener("mouseup", () => {
          Object.assign(button.style, hoverStyles[variant] || allStyles);
        });
      }

      if (onClick && !disabled && !loading) {
        button.addEventListener("click", onClick);
      }

      if (!document.getElementById("generic-button-spin-styles")) {
        const style = document.createElement("style");
        style.id = "generic-button-spin-styles";
        style.textContent = `
          @keyframes generic-button-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }

      return button;
    }

    return { createGenericButton, BUTTON_VARIANTS, BUTTON_SIZES };
  })();

  // Toggle state tracking (declare early to avoid TDZ when used in helpers)
  let isToggleOn = false;
  // Gate DOM mutations in nav until after hydration
  let canInsertToggle = false;

  // Ensure a predictable default: toggle OFF unless explicitly enabled previously
  try {
    if (localStorage.getItem(TOGGLE_KEY) === null) {
      localStorage.setItem(TOGGLE_KEY, "0");
    }
  } catch {}

  function isPromptField(el) {
    // Debug logging to see what we're checking
    if (el && el.tagName === "DIV") {
      log(
        "🔍 [isPromptField] Checking DIV - contenteditable:",
        el.contentEditable,
        "getAttribute:",
        el.getAttribute("contenteditable"),
      );
      log("🔍 [isPromptField] Element ID:", el.id, "Classes:", el.className);
    }

    // Ignore fields inside SuperPrompt UI
    try {
      if (el && el.closest && el.closest("[data-superprompt]")) {
        log("🔍 [isPromptField] Rejected: Inside SuperPrompt UI");
        return false;
      }
    } catch {}

    // Additional checks for SuperPrompt-specific field IDs/classes
    try {
      if (
        el &&
        el.id &&
        (el.id.startsWith("superprompt-") || el.id === "prompt-content")
      ) {
        log("🔍 [isPromptField] Rejected: SuperPrompt field ID");
        return false;
      }
      if (el && el.className && el.className.includes("superprompt")) {
        log("🔍 [isPromptField] Rejected: SuperPrompt class");
        return false;
      }
    } catch {}

    // More flexible check for prompt fields
    const isPrompt =
      el &&
      typeof el.getAttribute === "function" &&
      (el.tagName === "TEXTAREA" ||
        el.contentEditable === "true" ||
        el.getAttribute("contenteditable") === "true" ||
        el.hasAttribute("contenteditable"));

    log(
      "🔍 [isPromptField] Result:",
      isPrompt,
      "for element:",
      el?.tagName,
      el?.contentEditable,
    );
    return isPrompt;
  }

  function extractText(el) {
    return el?.value || el?.innerText || el?.textContent || "";
  }

  // Centralized logging bridge for injected context → content script logger
  // Safe no-ops if messaging fails; avoids crashing the injected script.
  function spPostLog(level, argsArray) {
    try {
      // Convert arguments to safe, serializable strings
      const safeArgs = (argsArray || []).map((v) => {
        try {
          if (v instanceof Error) return `${v.name}: ${v.message}`;
          if (typeof v === "string") return v;
          if (typeof v === "number" || typeof v === "boolean") return String(v);
          if (v === null || v === undefined) return String(v);
          // Try JSON first, fallback to toString
          try {
            return JSON.stringify(v);
          } catch (_) {
            return String(v);
          }
        } catch (_) {
          return "[unserializable]";
        }
      });
      window.postMessage(
        {
          type: "SUPERPROMPT_LOG",
          source: "chatgpt-injected",
          level,
          message: safeArgs.join(" "),
          args: safeArgs,
        },
        "*",
      );
    } catch (_) {
      // swallow – logging must never break functionality
    }
  }

  // Public logging helpers used throughout this file
  function spLog(...args) {
    spPostLog("debug", args);
  }
  function spInfo(...args) {
    spPostLog("info", args);
  }
  function spWarn(...args) {
    spPostLog("warn", args);
  }
  function spError(...args) {
    spPostLog("error", args);
  }

  function log(...args) {
    // Console logging disabled for production, except for user detection
    const msg = args.join(" ");
    if (
      msg.includes("user") ||
      msg.includes("ChatGPT") ||
      msg.includes("detection") ||
      msg.includes("registration")
    ) {
      devLog("[SuperPrompt User Detection]", ...args);
    }
  }
  // Shorthand for error logging with stack for quick tracing
  function logError(...args) {
    // Console error logging disabled for production, except for user detection
    const msg = args.join(" ");
    if (
      msg.includes("user") ||
      msg.includes("ChatGPT") ||
      msg.includes("detection") ||
      msg.includes("registration")
    ) {
      devError("[SuperPrompt User Detection]", ...args);
    }
  }

  // Helper: detect if a node (or its ancestors) looks React-managed
  function isReactNode(el) {
    try {
      if (!el) return false;
      if (
        el.hasAttribute &&
        (el.hasAttribute("data-reactroot") || el.hasAttribute("data-reactid"))
      )
        return true;
      // check internal fiber property (non-standard) lightly
      for (const key in el) {
        if (
          key.startsWith("__reactFiber$") ||
          key.startsWith("__reactInternalInstance$")
        )
          return true;
      }
      // walk up a few ancestors
      let p = el.parentElement;
      let steps = 0;
      while (p && steps++ < 5) {
        if (
          p.hasAttribute &&
          (p.hasAttribute("data-reactroot") || p.hasAttribute("data-reactid"))
        )
          return true;
        for (const key in p) {
          if (
            key.startsWith("__reactFiber$") ||
            key.startsWith("__reactInternalInstance$")
          )
            return true;
        }
        p = p.parentElement;
      }
    } catch (e) {}
    return false;
  }

  // ChatGPT Textarea Styling - Add accent border to input
  // ⚠️ DISABLED: Now handled by conversationStyling.js module for each style
  function injectChatGPTTextareaStyling() {
    // DISABLED: Conversation styling module now handles textarea styling
    return;
  }

  // Check if styled textarea is enabled in settings
  function isStyledTextareaEnabled() {
    // DISABLED: Always return false to prevent old styling
    return false;
  }

  // Remove ChatGPT textarea styling
  function removeChatGPTTextareaStyling() {
    const existingStyle = document.getElementById("sp-chatgpt-textarea-styles");
    if (existingStyle) {
      existingStyle.remove();
      log("✅ ChatGPT textarea styling removed");
    }
  }

  // Apply or remove textarea styling based on settings
  function updateChatGPTTextareaStyling() {
    // DISABLED: Conversation styling module now handles this
    // Just remove any old styles if they exist
    removeChatGPTTextareaStyling();
  }

  // Small in-memory circular buffer of recent actions for post-mortem
  const RECENT_EVENTS_MAX = 40;
  const recentEvents = [];

  // Global error hooks to capture the recent events when an error occurs
  try {
    window.addEventListener("error", () => {});
    window.addEventListener("unhandledrejection", () => {});
  } catch (e) {}

  // Minimal HTML escape to prevent XSS when injecting highlighted titles
  function escapeHtml(str) {
    return String(str).replace(/[&<>"'`=\/]/g, function (s) {
      return (
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
          "`": "&#96;",
          "=": "&#61;",
          "/": "&#47;",
        }[s] || s
      );
    });
  }

  // Get current conversation ID from URL
  function getCurrentConversationId() {
    const path = window.location.pathname;
    const match = path.match(/\/c\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  }

  // Insert a Print action next to ChatGPT's Share button in the conversation header
  function ensurePrintButton() {
    try {
      const convId = getCurrentConversationId();
      if (!convId) return;
      const headerActions = document.querySelector(
        "#conversation-header-actions",
      );
      if (!headerActions) return;
      const existingPrintBtn = headerActions.querySelector(
        "[data-sp-print-btn]",
      );
      const existingPreviewBtn = headerActions.querySelector(
        "[data-sp-preview-btn]",
      );

      // Preview button (open current conversation in SuperPrompt preview dialog)
      let previewBtn = existingPreviewBtn;
      if (!previewBtn) {
        previewBtn = document.createElement("button");
        previewBtn.setAttribute("data-sp-preview-btn", "1");
        previewBtn.setAttribute("aria-label", t("preview"));
        previewBtn.className =
          "btn relative btn-ghost text-token-text-primary mx-2";
        previewBtn.title = t("previewConversation");
        previewBtn.style.cursor = "pointer";
        previewBtn.innerHTML = `
          <div class="flex w-full items-center justify-center gap-1.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon">
              <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
              <path d="M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
            </svg>
            <div>${t("preview")}</div>
          </div>`;

        previewBtn.addEventListener("click", () => {
          const id = getCurrentConversationId();
          if (!id) return;
          window.postMessage(
            {
              type: "sp-open-chat-preview",
              chatId: id,
              standalone: true,
              source: "injected-header-preview",
            },
            "*",
          );
        });
      }

      // Print button
      let printBtn = existingPrintBtn;
      if (!printBtn) {
        printBtn = document.createElement("button");
        printBtn.setAttribute("data-sp-print-btn", "1");
        printBtn.setAttribute("aria-label", t("print"));
        printBtn.className =
          "btn relative btn-ghost text-token-text-primary mx-2";
        printBtn.title = t("printConversation");

        // Function to update button content
        function updateButtonContent(isLoading = false) {
          if (isLoading) {
            printBtn.innerHTML = `
              <div class="flex w-full items-center justify-center gap-1.5">
                <div class="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full"></div>
                <div>${t("printLoading")}</div>
              </div>`;
            printBtn.disabled = true;
            printBtn.style.opacity = "0.7";
          } else {
            printBtn.innerHTML = `
              <div class="flex w-full items-center justify-center gap-1.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon">
                  <path d="M6 9V2h12v7" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <path d="M6 14h12v8H6z" />
                </svg>
                <div>${t("print")}</div>
              </div>`;
            printBtn.disabled = false;
            printBtn.style.opacity = "1";
          }
        }

        // Set initial content
        updateButtonContent(false);

        // Per-click print completion handler with timeout to avoid infinite loading.
        // Starts a one-time message listener and enforces a 10s timeout.
        function startPrintFlowWithTimeout(chatId) {
          let settled = false;
          const TIMEOUT_MS = 10000; // 10 seconds

          function cleanup() {
            try {
              window.removeEventListener("message", onMessage);
            } catch (e) {}
            clearTimeout(timeoutHandle);
          }

          function finishSuccess() {
            if (settled) return;
            settled = true;
            cleanup();
            updateButtonContent(false);
          }

          function finishFailure() {
            if (settled) return;
            settled = true;
            cleanup();
            // Show failure message briefly then revert to normal
            printBtn.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.001 10h2v5h-2z"/><path d="M11 16h2v2h-2z"/></svg>
              <div>${t("printFailed")}</div>
            </div>`;
            printBtn.disabled = false;
            printBtn.style.opacity = "1";
            setTimeout(() => updateButtonContent(false), 3000);
          }

          function onMessage(event) {
            try {
              if (!event.data) return;
              if (event.data.type !== "sp-print-tab-opened") return;
              // Some senders include chatId, others don't. Accept either:
              // - If event includes chatId, ensure it matches current chatId
              // - Otherwise, accept success:true as a general completion signal
              if (typeof event.data.chatId !== "undefined") {
                if (event.data.chatId === chatId) {
                  finishSuccess();
                }
              } else if (event.data.success === true) {
                finishSuccess();
              }
            } catch (e) {
              // ignore
            }
          }

          window.addEventListener("message", onMessage);

          const timeoutHandle = setTimeout(() => {
            finishFailure();
          }, TIMEOUT_MS);
        }

        printBtn.addEventListener("click", (ev) => {
          const id = getCurrentConversationId();
          if (!id) return;

          // Show loading state immediately
          updateButtonContent(true);

          // Start per-click flow with timeout
          startPrintFlowWithTimeout(id);

          // Use the same preview print pipeline (themes, options) but silently (no visible dialog)
          window.postMessage(
            {
              type: "sp-open-chat-preview",
              chatId: id,
              autoPrint: true,
              silent: true,
              source: "injected",
            },
            "*",
          );
        });
      }

      // Note: print completion is handled per-click via startPrintFlowWithTimeout()

      const shareBtn = headerActions.querySelector(
        '[data-testid="share-chat-button"]',
      );
      if (shareBtn) {
        // Desired order: Preview, Print, Share
        if (!existingPrintBtn && !existingPreviewBtn) {
          shareBtn.insertAdjacentElement("beforebegin", printBtn);
          printBtn.insertAdjacentElement("beforebegin", previewBtn);
        } else if (existingPrintBtn && !existingPreviewBtn) {
          existingPrintBtn.insertAdjacentElement("beforebegin", previewBtn);
        } else if (!existingPrintBtn && existingPreviewBtn) {
          shareBtn.insertAdjacentElement("beforebegin", printBtn);
        }
      } else {
        // Fallback: append in the desired order
        if (!existingPreviewBtn) headerActions.appendChild(previewBtn);
        if (!existingPrintBtn) headerActions.appendChild(printBtn);
      }
    } catch (e) {}
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                            NOTES SYSTEM                                ██
  // ██                                                                        ██
  // ██  ⚠️  LEGACY CODE REMOVED - Now handled by notesManager.js module       ██
  // ██                                                                        ██
  // ██  All notes functionality (IndexedDB, UI, tabs, sidebar) has been      ██
  // ██  moved to src/injected/modules/notesManager.js for better             ██
  // ██  organization and to eliminate code duplication.                      ██
  // ██                                                                        ██
  // ██  The module is automatically loaded and initialized on ChatGPT pages. ██
  // ██  Access via: window.SuperPromptNotesManager                           ██
  // ██                                                                        ██
  // ██  Previously removed functions (~590 lines):                           ██
  // ██  • conversationHasNotes() → SuperPromptNotesManager.conversationHasNotes()
  // ██  • openNotesDb() → SuperPromptNotesManager.openNotesDb()              ██
  // ██  • createNoteTab() → SuperPromptNotesManager.createNoteTab()          ██
  // ██  • createScrollButtons() → SuperPromptNotesManager.createScrollButtons()
  // ██  • openNoteSidebar() → SuperPromptNotesManager.openNoteSidebar()      ██
  // ██  • loadExistingNoteContent() → SuperPromptNotesManager.loadExistingNoteContent()
  // ██  • saveNoteContent() → SuperPromptNotesManager.saveNoteContent()      ██
  // ██  • deleteNote() → SuperPromptNotesManager.deleteNote()                ██
  // ██  • updateNoteTab() → SuperPromptNotesManager.updateNoteTab()          ██
  // ██  • initializeNoteTab() → SuperPromptNotesManager.initializeNoteTab()  ██
  // ██  • getAccentColorForButtons() - Utility function (also removed)       ██
  // ██████████████████████████████████████████████████████████████████████████████

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                          MESSAGE OVERLAYS                              ██
  // ██                                                                        ██
  // ██  ⚠️  LEGACY CODE REMOVED - Now handled by messageOverlays.js module    ██
  // ██                                                                        ██
  // ██  All message overlay functionality (char/word counts, timestamps)     ██
  // ██  has been moved to src/injected/modules/messageOverlays.js for        ██
  // ██  better organization and to eliminate code duplication.               ██
  // ██                                                                        ██
  // ██  The module is automatically loaded and initialized on ChatGPT pages. ██
  // ██  Access via: window.SuperPromptMessageOverlays                        ██
  // ██                                                                        ██
  // ██  Previously removed functions (~320 lines):                           ██
  // ██  • getOverlaysSetting() / setOverlaysSetting()                        ██
  // ██  • findAssistantArticleGroups()                                       ██
  // ██  • getChatMessageTimestamp()                                          ██
  // ██  • formatTimestamp() / formatCounts() / formatCountsWithTimestamp()   ██
  // ██  • computeGroupTextCounts()                                           ██
  // ██  • renderOverlayForGroup()                                            ██
  // ██  • annotateAssistantMessages()                                        ██
  // ██  • refreshAllOverlays()                                               ██
  // ██  • window.spToggleMessageOverlays()                                   ██
  // ██  • window.testSuperPromptOverlays()                                   ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Watch for URL changes and content updates to update note tab
  let currentUrl = window.location.href;
  let contentObserver = null;
  let urlHookInstalled = false;
  let lastNavCause = "init"; // 'push' | 'replace' | 'pop' | 'init'
  // Navigation session control to avoid duplicate loops and reduce overhead during heavy loads
  let navSessionId = 0; // monotonically increasing id for each navigation
  let navSessionActive = false; // fast flag for observers to bail
  let navSessionTimer = null; // current retry timer for content check loop
  // Track baseline DOM snapshot at the moment of navigation to avoid
  // treating previous conversation content as the new one
  let navBaseline = null; // { convId, time, firstTurnEl, firstTurnText, turns, messages }
  let contentResetObserved = false; // set true if we see container clear/reset after nav
  let navSwapAt = 0; // timestamp when we first detect DOM differs from baseline/reset
  // Long task & scroll metrics during navigation
  let longTaskObserver = null;
  let longTaskCount = 0;
  let lastLongTaskAt = 0;
  let lastScrollHeight = 0;
  let lastScrollHeightChangeAt = 0;

  // --- Conversation Loading Overlay (theme-aware) ---
  function getAccentColorFallback() {
    try {
      const rs = window.getComputedStyle(document.documentElement);
      const v = (rs.getPropertyValue("--color-accent") || "").trim();
      if (v) return v;
    } catch {}
    return "#38bdf8"; // cyan-400 fallback
  }

  function isDarkTheme() {
    try {
      if (typeof globalCurrentTheme === "string") {
        return /dark|midnight|amoled/i.test(globalCurrentTheme);
      }
      return (
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark")
      );
    } catch {
      return false;
    }
  }

  function hideConversationLoadingOverlay() {
    try {
      const overlay = document.getElementById("sp-conv-loading");
      if (!overlay) return;

      // Log timing info if we have start time
      if (window.spConvLoadStart) {
        const loadTime = performance.now() - window.spConvLoadStart;
        log(
          `⏱️ Conversation load completed in ${loadTime.toFixed(2)}ms (${(
            loadTime / 1000
          ).toFixed(1)}s)`,
        );
        // Persist load history for this conversation for future hints
        try {
          const convId =
            window.spCurrentConvId || overlay.getAttribute("data-conv-id");
          const histRaw = localStorage.getItem("spConvLoadHistory");
          const hist = histRaw ? JSON.parse(histRaw) : {};
          hist[convId] = { timeMs: Math.round(loadTime), ts: Date.now() };
          // Keep map small
          const keys = Object.keys(hist);
          if (keys.length > 50) {
            // Drop oldest
            keys.sort((a, b) => (hist[a].ts || 0) - (hist[b].ts || 0));
            for (let i = 0; i < keys.length - 50; i++) delete hist[keys[i]];
          }
          localStorage.setItem("spConvLoadHistory", JSON.stringify(hist));
        } catch {}
        delete window.spConvLoadStart;
        delete window.spCurrentConvId;
      }
      if (window.spClTicker) {
        clearInterval(window.spClTicker);
        delete window.spClTicker;
      }
      if (longTaskObserver) {
        try {
          longTaskObserver.disconnect();
        } catch {}
        longTaskObserver = null;
      }

      overlay.style.transition = "opacity .15s ease";
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.remove();
      }, 180);
      // Clear vault navigation flags once loading is complete
      try {
        sessionStorage.removeItem("sp-vault-nav-active");
        // Keep last selected conv so Notes tab can validate it
      } catch {}
      // End navigation session (resume lightweight watchers)
      try {
        navSessionActive = false;
        // Resume URL polling
        startUrlWatching();
        // Cancel any leftover retry timer
        if (navSessionTimer) {
          clearTimeout(navSessionTimer);
          navSessionTimer = null;
        }
        // If vault rerender was deferred while conversation was loading, do it now
        if (pendingVaultRerender) {
          pendingVaultRerender = false;
          if (getAltViewState()) {
            try {
              // Vault rendering now handled by vaultSidebar.js module
            } catch {}
          }
        }
        // Ensure our view is mounted and the native list remains hidden post-navigation
        if (getAltViewState()) {
          try {
            try {
              // Vault rendering now handled by vaultSidebar.js module
            } catch {}
          } catch {}
        }
      } catch {}
    } catch {}
  }

  function watchForUrlChanges() {
    const newUrl = window.location.href;
    if (newUrl !== currentUrl) {
      currentUrl = newUrl;
      log("🔄 URL changed to:", newUrl);

      // If this is a GPT route (/g/...), there is no conversation content to wait for.
      // Immediately end any pending navigation session and make sure our sidebar renders.
      if (/\/g\//.test(newUrl)) {
        try {
          hideConversationLoadingOverlay();
        } catch {}
        navBaseline = null;
        contentResetObserved = false;
        navSessionActive = false;
        if (navSessionTimer) {
          try {
            clearTimeout(navSessionTimer);
          } catch {}
          navSessionTimer = null;
        }
        // Ensure URL watcher is running again
        startUrlWatching();
        // If the user has our view enabled, (re)render immediately so the treeview persists
        if (getAltViewState()) {
          try {
            // Proactively keep native list hidden on GPT pages
            hideDefaultChatsList(true);
            startNavListHideObserver();
            try {
              // Vault rendering now handled by vaultSidebar.js module
            } catch {}
          } catch (e) {
            log("⚠️ renderVaultSidebarView on GPT route failed:", e);
          }
        }
        // Nothing else to do for GPT routes (no conversation readiness to wait for)
        return;
      }

      // Remove existing note tab immediately
      const existingTab = document.querySelector(".sp-note-tab");
      if (existingTab) existingTab.remove();

      // Record a baseline snapshot from the current (old) DOM to prevent premature readiness
      try {
        const baselineTurns = document.querySelectorAll(
          '[data-testid*="conversation-turn"]',
        ).length;
        const baselineMsgs = document.querySelectorAll(
          ".group\\/conversation-turn, [data-message-author-role], .whitespace-pre-wrap",
        ).length;
        const firstTurnEl = document.querySelector(
          '[data-testid*="conversation-turn"], .group\\/conversation-turn',
        );
        const firstTurnText = (firstTurnEl?.textContent || "")
          .trim()
          .slice(0, 140);
        navBaseline = {
          convId: getCurrentConversationId(),
          time: performance.now(),
          turns: baselineTurns,
          messages: baselineMsgs,
          firstTurnEl,
          firstTurnText,
        };
        contentResetObserved = false;
        log(
          `🧭 Nav baseline set: turns=${baselineTurns}, messages=${baselineMsgs}, firstTurnText.len=${firstTurnText.length}`,
        );
      } catch {}

      // While navigating to another conversation, proactively keep the native list hidden
      try {
        if (getAltViewState()) {
          hideDefaultChatsList(true);
          startNavListHideObserver();
          // Make sure a host exists so we don't "fall back" to default list visually
          ensureShadowContainer();
        }
      } catch {}

      // Try multiple times with shorter intervals for faster response
      // Start a new content-check session; cancel any previous loop
      if (navSessionTimer) {
        try {
          clearTimeout(navSessionTimer);
        } catch {}
        navSessionTimer = null;
      }
      const mySessionId = ++navSessionId;
      navSessionActive = true; // ensure observers bail during navigation
      let attempts = 0;
      const maxAttempts = 80; // Adaptive backoff, ~60s max
      // Show overlay (also ensures nav session and pauses polling) only when allowed
      const convIdForOverlay = getCurrentConversationId();
      try {
        const suppressNew = sessionStorage.getItem("sp-new-chat") === "true";
        const wasFromVault =
          sessionStorage.getItem("sp-vault-nav-active") === "true";
        const lastSel = sessionStorage.getItem("sp-vault-selected-conv");
        const allowVault =
          wasFromVault && lastSel && lastSel === convIdForOverlay;
        // Check if we already loaded full content to avoid duplicate overlay
        const fullContentAlreadyLoaded =
          sessionStorage.getItem("sp-full-content-loaded") === "true";
        // Never show overlay for vault navigation - it's handled elsewhere
        const allow =
          !suppressNew &&
          !wasFromVault &&
          (allowVault || lastNavCause === "pop") &&
          !fullContentAlreadyLoaded;
        // DISABLED: Loading spinner removed
        // if (convIdForOverlay && allow)
        //   showConversationLoadingOverlay(convIdForOverlay);
      } catch {
        // If detection fails, prefer not showing the overlay
      }

      const tryInitialize = () => {
        // If a newer navigation session started, stop this loop
        if (mySessionId !== navSessionId) return;
        attempts++;
        const conversationId = getCurrentConversationId();

        // More specific check for actual conversation content being loaded
        const hasConversationContent = () => {
          // Look for actual conversation turns/messages, not just containers
          const chatContent = document.querySelector(
            '[data-testid="conversation-content"], .flex.flex-col.text-sm',
          );
          const turns = chatContent
            ? chatContent.querySelectorAll('[data-testid*="conversation-turn"]')
            : document.querySelectorAll('[data-testid*="conversation-turn"]');
          const messageElements = chatContent
            ? chatContent.querySelectorAll(
                ".group\\/conversation-turn, [data-message-author-role], .whitespace-pre-wrap",
              )
            : document.querySelectorAll(
                ".group\\/conversation-turn, [data-message-author-role], .whitespace-pre-wrap",
              );

          // Check if we have actual message content, not just loading states
          const hasMessages = turns.length > 0 || messageElements.length > 0;
          const hasLoadingSpinner = document.querySelector(
            '[data-testid="loading"], .animate-spin, .loading',
          );
          const hasErrorState = document.querySelector(
            '[data-testid="error"], .error',
          );

          // Check if ChatGPT is still heavily rendering (look for performance issues)
          const isHeavyRendering = () => {
            // Check if there are many pending DOM mutations or React is busy
            const reactFiber =
              document.querySelector("[data-reactroot]")?._reactInternals;
            const hasPendingWork = reactFiber?.pendingTime > 0;

            // Check if there are many unrendered conversation turns vs actual visible content
            const visibleMessages = chatContent
              ? chatContent.querySelectorAll(
                  '[data-message-author-role]:not([style*="display: none"])',
                )
              : document.querySelectorAll(
                  '[data-message-author-role]:not([style*="display: none"])',
                );
            const expectedTurns = turns.length;
            const actuallyVisible = visibleMessages.length;

            // If we expect many turns but don't see them yet, still rendering
            const stillRenderingTurns =
              expectedTurns > 10 && actuallyVisible < expectedTurns * 0.8;

            // Long tasks in the last second indicate heavy main-thread work
            // Prefer a tight window to avoid keeping heavyRender=true for long
            const recentLongTasks =
              lastLongTaskAt && performance.now() - lastLongTaskAt < 400;

            // ScrollHeight growth indicates content inflating even if nodes reuse
            try {
              const container = chatContent;
              if (container) {
                const sh = container.scrollHeight || 0;
                if (sh !== lastScrollHeight) {
                  lastScrollHeightChangeAt = performance.now();
                  lastScrollHeight = sh;
                }
              }
            } catch {}
            const recentHeightGrowth =
              lastScrollHeightChangeAt &&
              performance.now() - lastScrollHeightChangeAt < 400;

            return (
              hasPendingWork ||
              stillRenderingTurns ||
              recentLongTasks ||
              recentHeightGrowth
            );
          };
          // Baseline comparison to avoid accepting stale DOM from previous conversation
          let differsFromBaseline = true;
          try {
            if (navBaseline) {
              const firstTurnNow = document.querySelector(
                '[data-testid*="conversation-turn"], .group\\/conversation-turn',
              );
              const firstTurnNowText = (firstTurnNow?.textContent || "")
                .trim()
                .slice(0, 140);
              const sameFirstNode =
                firstTurnNow &&
                navBaseline.firstTurnEl &&
                firstTurnNow === navBaseline.firstTurnEl;
              const sameFirstText =
                firstTurnNowText &&
                firstTurnNowText === navBaseline.firstTurnText;
              const sameCounts =
                turns.length === navBaseline.turns &&
                messageElements.length === navBaseline.messages;
              differsFromBaseline = !(
                sameFirstNode ||
                (sameFirstText && sameCounts)
              );
              if (differsFromBaseline && !navSwapAt) {
                navSwapAt = performance.now();
              }
            }
          } catch {}

          // Observe reset/clear on the main conversation container after navigation
          try {
            const container =
              document.querySelector(
                '[data-testid="conversation-content"], .flex.flex-col.text-sm',
              ) || chatContent;
            if (container && !container.__spResetWatcherInstalled) {
              container.__spResetWatcherInstalled = true;
              const mo = new MutationObserver(() => {
                // If container temporarily has very few children, consider it a reset
                const c = container.children?.length || 0;
                if (c <= 1) {
                  contentResetObserved = true;
                }
              });
              mo.observe(container, { childList: true, subtree: false });
              // Stop watching after 30s to avoid leaks
              setTimeout(() => mo.disconnect(), 30000);
            }
          } catch {}

          const elapsed = navBaseline
            ? performance.now() - navBaseline.time
            : 0;
          const lt = longTaskCount;
          // Throttle noisy logs: log first 3 attempts, then every 5th
          if (attempts <= 3 || attempts % 5 === 0) {
            log(
              `🔍 Content check attempt ${attempts}: turns=${
                turns.length
              }, messages=${
                messageElements.length
              }, loading=${!!hasLoadingSpinner}, error=${!!hasErrorState}, chatContent=${!!chatContent}, heavyRender=${isHeavyRendering()}, differsFromBaseline=${differsFromBaseline}, resetObserved=${contentResetObserved}, elapsed=${elapsed.toFixed(
                0,
              )}ms, longTasks=${lt}, scrollH=${
                (
                  document.querySelector(
                    '[data-testid="conversation-content"], .flex.flex-col.text-sm',
                  ) || {}
                ).scrollHeight || 0
              }`,
            );
          }

          // Only consider content loaded if:
          // 1. We have actual message content OR chat content container exists
          // 2. AND there's no loading spinner (unless it's been more than 5 seconds)
          // 3. AND there's no error state
          // 4. AND ChatGPT isn't heavily rendering (unless it's been more than 10 seconds)
          // 5. AND the DOM differs from the pre-navigation baseline OR we saw a container reset,
          //    otherwise we might be looking at stale content from the previous chat
          const timeoutOverride = attempts > 10; // 5 seconds timeout
          const heavyRenderTimeout =
            (navSwapAt && performance.now() - navSwapAt > 2500) ||
            elapsed > 15000; // allow after 2.5s post-swap or 15s total
          const baselineTimeout = elapsed > 60000; // 60s hard cap

          // For new conversations (no baseline or baseline with zero content), accept immediately if we have any content
          const isNewConversation =
            !navBaseline ||
            ((navBaseline.turns || 0) === 0 &&
              (navBaseline.messages || 0) === 0);
          const baselineGuardSatisfied =
            isNewConversation ||
            differsFromBaseline ||
            contentResetObserved ||
            baselineTimeout;

          return (
            (hasMessages || chatContent) &&
            (!hasLoadingSpinner || timeoutOverride) &&
            !hasErrorState &&
            (!isHeavyRendering() || heavyRenderTimeout) &&
            baselineGuardSatisfied
          );
        };

        if (conversationId && hasConversationContent()) {
          log("✅ Actual conversation content detected, initializing note tab");
          hideConversationLoadingOverlay();
          // Clear the full content loaded flag since navigation is complete
          sessionStorage.removeItem("sp-full-content-loaded");
          // Clear baseline after success
          navBaseline = null;
          contentResetObserved = false;
          // Note tab now handled by notesManager.js module
          return;
        }

        if (attempts < maxAttempts) {
          // Adaptive backoff: 0-5s @400ms, 5-15s @800ms, >15s @1500ms
          const elapsed = navBaseline
            ? performance.now() - navBaseline.time
            : attempts * 500;
          const delay = elapsed < 5000 ? 400 : elapsed < 15000 ? 800 : 1500;
          navSessionTimer = setTimeout(tryInitialize, delay);
        } else {
          log("⚠️ Max attempts reached, falling back to basic initialization");
          hideConversationLoadingOverlay();
          // Clear the full content loaded flag since navigation is complete (even if fallback)
          sessionStorage.removeItem("sp-full-content-loaded");
          navBaseline = null;
          contentResetObserved = false;
          // Note tab now handled by notesManager.js module
          try {
            sessionStorage.removeItem("sp-vault-nav-active");
          } catch {}
        }
      };

      // Start trying immediately
      navSessionTimer = setTimeout(tryInitialize, 120);
    }
  }

  // Lightweight SPA hooks to detect in-app navigations quickly
  function installUrlHooks() {
    if (urlHookInstalled) return;
    urlHookInstalled = true;

    const notify = () => {
      // Defer slightly to let ChatGPT update center content
      setTimeout(watchForUrlChanges, 50);
      // If a brand-new chat was triggered, suppress any loader explicitly
      try {
        if (sessionStorage.getItem("sp-new-chat") === "true") {
          sessionStorage.removeItem("sp-new-chat");
          hideConversationLoadingOverlay();
          navBaseline = null;
          contentResetObserved = false;
          navSessionActive = false;
          startUrlWatching();
          return;
        }
      } catch {}
      // Show loader only for navigation TO existing conversations, not for new ones
      const id = getCurrentConversationId();
      if (id) {
        // Check if this is a navigation to an existing conversation
        // (not a brand new conversation being created)
        const wasFromVaultSidebar =
          sessionStorage.getItem("sp-vault-nav-active") === "true";
        const lastSelectedConv = sessionStorage.getItem(
          "sp-vault-selected-conv",
        );
        const matchesVaultTarget =
          wasFromVaultSidebar && lastSelectedConv === id;
        // Only show loader if it's vault-driven and matches the selected id, or the user used browser back/forward
        const shouldShowLoader = matchesVaultTarget || lastNavCause === "pop";

        // CRITICAL FIX: If clicking on the same conversation that's already open,
        // don't show loader at all - the content is already there
        const isSameConversation = navBaseline && navBaseline.convId === id;

        if (shouldShowLoader && !isSameConversation) {
          // Establish a minimal baseline immediately for fresh chats
          try {
            navBaseline = {
              convId: id,
              time: performance.now(),
              firstTurnEl: null,
              firstTurnText: "",
              turns: 0,
              messages: 0,
            };
          } catch {}
          // DISABLED: Loading spinner removed
          // showConversationLoadingOverlay(id);
        } else {
          // Ensure no stale loader remains visible for non-loader navigations
          hideConversationLoadingOverlay();
          navBaseline = null;
          contentResetObserved = false;
          navSessionActive = false;
          startUrlWatching();
        }
        // Do not clear nav flags here; let them be cleared once content/overlay is done
        // URL watching is paused by overlay/session and will resume when loading finishes
      }
    };

    // ████████████████████████████████████████████████████████████████████████████
    // ██  HISTORY API HOOKS - NOW HANDLED BY eventManager.js MODULE          ██
    // ████████████████████████████████████████████████████████████████████████████
    // The eventManager.js module already installs history.pushState/replaceState
    // overrides and popstate listeners. Removed duplicate hooks here to prevent
    // double-triggering navigation events.
    // ████████████████████████████████████████████████████████████████████████████

    // Anchor clicks inside app
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest && e.target.closest("a[href]");
        if (!a) return;
        const href = a.getAttribute("href");
        if (!href) return;
        // Only internal chats
        if (/\/c\//.test(href)) {
          // Check if this is from our vault sidebar
          const isFromVaultSidebar =
            a.closest(".vault-sidebar") ||
            a.classList.contains("sp-vault-item");
          if (isFromVaultSidebar) {
            sessionStorage.setItem("sp-vault-nav-active", "true");
            try {
              const mId = href.match(/\/c\/([^/?#]+)/);
              if (mId && mId[1])
                sessionStorage.setItem("sp-vault-selected-conv", mId[1]);
            } catch {}
          }

          // Let ChatGPT handle navigation, we just schedule a check (no loader for vault sidebar clicks anymore)
          const m = href.match(/\/c\/([^/?#]+)/);
          if (m && m[1] && isFromVaultSidebar) {
            // Don't show loading overlay for vault sidebar clicks - they handle their own loading
            // showConversationLoadingOverlay(m[1]);
          }
          setTimeout(watchForUrlChanges, 50);
        }
      },
      true,
    );

    // Detect explicit "New chat" creations to suppress loader
    document.addEventListener(
      "click",
      (e) => {
        try {
          const btn = e.target.closest(
            '[aria-label*="New chat" i], [data-testid*="new-chat" i], a[href="/"], button[aria-label*="New" i]',
          );
          if (btn) {
            sessionStorage.setItem("sp-new-chat", "true");
          }
        } catch {}
      },
      true,
    );
  }

  // Watch for manager state changes via window messages
  function hideNoteTabImmediate() {
    try {
      const tab = document.querySelector(".sp-note-tab");
      if (tab) {
        tab.remove();
        log("🚫 Notes tab removed due to manager state");
      }
    } catch {}
  }

  function startManagerWatcher() {
    try {
      // Listen for manager state changes from the React app
      window.addEventListener("message", (event) => {
        if (event.data && event.data.type === "sp-manager-state-change") {
          managerIsOpen = event.data.showManager === true;
          log("🔄 Manager state changed to:", managerIsOpen);
          if (managerIsOpen) {
            hideNoteTabImmediate();
          } else {
            try {
              if (typeof window._spScheduleNotesTabGuardCheck === "function") {
                window._spScheduleNotesTabGuardCheck();
              }
            } catch {}
          }
        }
      });

      // Fallback: check for existing manager dialogs on init
      if (document.querySelector(".dialog-overlay, .prompt-manager")) {
        managerIsOpen = true;
        hideNoteTabImmediate();
      }
    } catch (e) {
      log("Manager watcher setup failed:", e);
    }
  }

  // Also watch for DOM content changes to catch faster loading
  // 🚫 LEGACY: Notes UI now handled by notesManager.js module
  function setupContentObserver() {
    // 🚨 SAFETY: Skip all observers when disabled to prevent DOM conflicts
    if (DISABLE_MUTATION_OBSERVERS || !USE_LEGACY_NOTES_UI) {
      return;
    }

    if (contentObserver) {
      contentObserver.disconnect();
    }

    contentObserver = window._spCreateObserver((mutations) => {
      // 🚨 SMART SAFETY: Skip during new chat creation (now uses coreUtils module)
      if (window.SuperPromptCoreUtils && !window.SuperPromptCoreUtils.isSafeToOperate()) {
        return;
      }

      // Skip heavy work during navigation/overlay mode entirely
      if (navSessionActive) return;
      // More thorough check for conversation content being ready
      const hasSignificantChange = mutations.some(
        (mutation) =>
          mutation.type === "childList" &&
          mutation.addedNodes.length > 0 &&
          Array.from(mutation.addedNodes).some(
            (node) =>
              node.nodeType === 1 &&
              (node.matches?.('[data-testid*="conversation-turn"]') ||
                node.querySelector?.('[data-testid*="conversation-turn"]') ||
                node.matches?.("[data-message-author-role]") ||
                node.querySelector?.("[data-message-author-role]") ||
                node.matches?.(".whitespace-pre-wrap") ||
                node.querySelector?.(".whitespace-pre-wrap")),
          ),
      );

      // Also detect when heavy mutation activity stops (ChatGPT finished rendering)
      const isHeavyMutationActivity = mutations.length > 10; // Many mutations at once

      if (hasSignificantChange && !isHeavyMutationActivity) {
        const conversationId = getCurrentConversationId();
        const existingTab = document.querySelector(".sp-note-tab");

        // Check if we have actual conversation content, not just containers
        const hasActualContent = () => {
          const turns = document.querySelectorAll(
            '[data-testid*="conversation-turn"]',
          );
          const messageElements = document.querySelectorAll(
            ".group\\/conversation-turn, [data-message-author-role], .whitespace-pre-wrap",
          );
          const hasLoadingSpinner = document.querySelector(
            '[data-testid="loading"], .animate-spin, .loading',
          );

          // For large conversations, also check if rendering seems stable
          const visibleMessages = document.querySelectorAll(
            '[data-message-author-role]:not([style*="display: none"])',
          );
          const isLargeConversation = turns.length > 50;
          const renderingStable =
            !isLargeConversation ||
            visibleMessages.length >= turns.length * 0.8;

          return (
            (turns.length > 0 || messageElements.length > 0) &&
            !hasLoadingSpinner &&
            renderingStable
          );
        };

        // Only initialize if we have a conversation ID, no tab exists, and actual content is ready
        if (conversationId && !existingTab && hasActualContent()) {
          log("🔄 Stable conversation content detected, updating note tab");
          hideConversationLoadingOverlay();
          setTimeout(initializeNoteTab, 200);
        }
      }
    });

    // Watch the main content area for changes
    const targetNode = document.querySelector("main") || document.body;
    if (targetNode) {
      contentObserver.observe(targetNode, {
        childList: true,
        subtree: true,
      });
    }
  }

  // --- Sidebar Width Helpers ---
  function setWidth(el, px) {
    try {
      if (!el) return;
      if (px) {
        // Store original values if not already stored
        if (!el.hasAttribute("data-sp-original-width")) {
          const computedStyle = window.getComputedStyle(el);
          el.setAttribute("data-sp-original-width", computedStyle.width);
          el.setAttribute("data-sp-original-min-width", computedStyle.minWidth);
          el.setAttribute("data-sp-original-max-width", computedStyle.maxWidth);
        }

        el.style.width = px + "px";
        el.style.minWidth = px + "px";
        el.style.maxWidth = "none";
        // Prevent layout jump animations
        el.style.transition = "width 120ms ease, min-width 120ms ease";
        log("✅ Width set to", px + "px", "for element:", el);
      } else {
        // Reset by removing inline styles completely
        el.style.removeProperty("width");
        el.style.removeProperty("min-width");
        el.style.removeProperty("max-width");
        el.style.removeProperty("transition");

        // Remove our data attributes
        el.removeAttribute("data-sp-original-width");
        el.removeAttribute("data-sp-original-min-width");
        el.removeAttribute("data-sp-original-max-width");

        log("✅ Width reset for element:", el);
      }
    } catch (e) {
      log("❌ Error setting width:", e);
    }
  }

  function setSidebarCSSVariable(width) {
    // Update ChatGPT's CSS variable that controls sidebar width
    const widthValue = width ? `${width}px` : null;
    if (widthValue) {
      document.documentElement.style.setProperty("--sidebar-width", widthValue);
      log("✅ CSS variable --sidebar-width set to", widthValue);
    } else {
      document.documentElement.style.removeProperty("--sidebar-width");
      log("✅ CSS variable --sidebar-width reset");
    }
  }

  // --- Pre-hide CSS to avoid native list flicker ---
  function ensurePrehideStyle() {
    try {
      if (document.getElementById("sp-prehide-native-list")) return;
      const style = document.createElement("style");
      style.id = "sp-prehide-native-list";
      style.textContent = `
        /* When our alt view is active, hide native conversation links/items in nav to avoid flicker */
        html[data-sp-alt-view="1"] nav a[href^="/c/"],
        html[data-sp-alt-view="1"] nav a[href*="/c/"] { display: none !important; }
        /* Common wrappers that directly contain conversation anchors */
        html[data-sp-alt-view="1"] nav li:has(> a[href^="/c/"]),
        html[data-sp-alt-view="1"] nav li:has(> a[href*="/c/"]) { display: none !important; }
        html[data-sp-alt-view="1"] nav div:has(> a[href^="/c/"]),
        html[data-sp-alt-view="1"] nav div:has(> a[href*="/c/"]) { display: none !important; }
        html[data-sp-alt-view="1"] nav [role="list"]:has(a[href^="/c/"]),
        html[data-sp-alt-view="1"] nav [role="list"]:has(a[href*="/c/"]) { display: none !important; }
      `;
      document.head
        ? document.head.appendChild(style)
        : document.documentElement.appendChild(style);
    } catch {}
  }

  // --- Smooth animation helpers ---
  let _animFrameId = null;
  let _isAnimating = false;
  function cancelSidebarAnimation() {
    if (_animFrameId) {
      cancelAnimationFrame(_animFrameId);
      _animFrameId = null;
    }
    _isAnimating = false;
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function animateSidebarWidth(fromPx, toPx, durationMs, onUpdate, onDone) {
    const start = performance.now();
    _isAnimating = true;
    const step = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeInOutQuad(t);
      const current = fromPx + (toPx - fromPx) * eased;
      try {
        onUpdate(current);
      } catch {}
      if (t < 1) {
        _animFrameId = requestAnimationFrame(step);
      } else {
        _isAnimating = false;
        try {
          onDone && onDone();
        } catch {}
      }
    };
    _animFrameId = requestAnimationFrame(step);
  }

  function findCompanionSidebar() {
    // Find the companion sidebar without ID that should match width
    const main = document.getElementById("stage-slideover-sidebar");
    if (!main) return null;

    // Strategy 1: Look for the nav element's parent container
    const nav = document.querySelector("nav");
    if (nav) {
      // Go up the DOM tree to find the main sidebar container
      let current = nav.parentElement;
      while (current && current !== document.body) {
        // Look for a container that looks like the main sidebar wrapper
        if (current.offsetWidth > 200 && current.offsetHeight > 400) {
          log("✅ Found nav parent container:", current);
          return current;
        }
        current = current.parentElement;
      }
    }

    // Strategy 2: Look for parent of the main sidebar
    const parent = main.parentElement;
    if (!parent) return null;

    // Strategy 3: Look for sibling divs that look like sidebar containers
    const siblings = Array.from(parent.children).filter(
      (child) =>
        child !== main && child.tagName === "DIV" && child.offsetHeight > 100, // Only consider substantial containers
    );

    // Strategy 4: Look for any container that wraps the nav
    const containers = document.querySelectorAll("div");
    for (const container of containers) {
      if (
        container.contains(nav) &&
        container !== nav &&
        container.offsetWidth > 200
      ) {
        log("✅ Found nav wrapper container:", container);
        return container;
      }
    }

    // Return the first substantial sibling or the parent itself
    return siblings[0] || parent;
  }

  function applySidebarWidth(on) {
    log("🔧 Applying sidebar width:", on ? DESIRED_WIDTH + "px" : "default");

    const mainSidebar = document.getElementById("stage-slideover-sidebar");
    if (!mainSidebar) {
      log("❌ Main sidebar not found");
      return;
    }

    // Find all possible sidebar containers
    const companionSidebar = findCompanionSidebar();
    const nav = document.querySelector("nav");

    // Also try to find the visual sidebar container (the one user sees)
    const visualSidebar = nav
      ? nav.closest(
          'div[style*="width"], div[class*="sidebar"], div[class*="slide"]',
        )
      : null;

    // Prepare: reset inner containers to avoid crowding/sticky issues
    const resetInner = () => {
      if (companionSidebar) {
        setWidth(companionSidebar, null);
        companionSidebar.style.removeProperty("flex-basis");
        companionSidebar.style.removeProperty("min-width");
        companionSidebar.style.removeProperty("max-width");
      }
      if (
        visualSidebar &&
        visualSidebar !== companionSidebar &&
        visualSidebar !== mainSidebar
      ) {
        setWidth(visualSidebar, null);
        visualSidebar.style.removeProperty("flex-basis");
        visualSidebar.style.removeProperty("min-width");
        visualSidebar.style.removeProperty("max-width");
      }
    };

    // Cancel any running animation
    cancelSidebarAnimation();

    const computed = window.getComputedStyle(mainSidebar);
    const currentWidth =
      parseFloat(computed.width) || mainSidebar.offsetWidth || 0;

    if (on) {
      document.documentElement.setAttribute("data-sp-alt-view", "1");
      resetInner();

      // Disable transition during JS-driven animation to prevent stutter
      const prevTransition = mainSidebar.style.transition;
      mainSidebar.style.transition = "none";

      animateSidebarWidth(
        currentWidth,
        DESIRED_WIDTH,
        ANIM_DURATION_MS,
        (val) => {
          const px = Math.round(val);
          // Update CSS var and inline width in sync
          document.documentElement.style.setProperty(
            "--sidebar-width",
            px + "px",
          );
          mainSidebar.style.width = px + "px";
          mainSidebar.style.minWidth = px + "px";
          mainSidebar.style.maxWidth = "none";
        },
        () => {
          // Commit final styles using our helper (restores a small transition for future layout changes)
          setSidebarCSSVariable(DESIRED_WIDTH);
          setWidth(mainSidebar, DESIRED_WIDTH);
          // Restore original transition (setWidth sets its own, so prefer that)
          if (prevTransition) mainSidebar.style.transition = prevTransition;
          log("✅ Sidebar width set to", DESIRED_WIDTH + "px (animated)");
        },
      );
    } else {
      // Animate back close to default, then clear our styles
      const target = DEFAULT_WIDTH_GUESS;
      const prevTransition = mainSidebar.style.transition;
      mainSidebar.style.transition = "none";

      animateSidebarWidth(
        currentWidth,
        target,
        ANIM_DURATION_MS,
        (val) => {
          const px = Math.round(val);
          document.documentElement.style.setProperty(
            "--sidebar-width",
            px + "px",
          );
          mainSidebar.style.width = px + "px";
          mainSidebar.style.minWidth = px + "px";
          mainSidebar.style.maxWidth = "none";
        },
        () => {
          // Now clear CSS var and all inline widths so ChatGPT regains control
          setSidebarCSSVariable(null);
          setWidth(mainSidebar, null);
          if (companionSidebar) setWidth(companionSidebar, null);
          if (
            visualSidebar &&
            visualSidebar !== companionSidebar &&
            visualSidebar !== mainSidebar
          )
            setWidth(visualSidebar, null);

          [mainSidebar, companionSidebar, visualSidebar].forEach((el) => {
            if (el) {
              el?.style?.removeProperty("flex-basis");
              el?.style?.removeProperty("min-width");
              el?.style?.removeProperty("max-width");
            }
          });

          if (prevTransition) mainSidebar.style.transition = prevTransition;
          document.documentElement.removeAttribute("data-sp-alt-view");
          log("✅ Sidebar width reset to default (animated)");
        },
      );
    }
  }

  function getAltViewState() {
    try {
      const state = localStorage.getItem(TOGGLE_KEY) === "1";
      isToggleOn = state; // Keep in sync
      return state;
    } catch {
      isToggleOn = false;
      return false;
    }
  }

  function setAltViewState(on) {
    // [Production] Setting vault view state

    try {
      localStorage.setItem(TOGGLE_KEY, on ? "1" : "0");
      // [Production] LocalStorage updated
    } catch (e) {
      // [Production] Failed to update localStorage
    }

    // Update toggle state tracking
    isToggleOn = on;
    // [Production] Toggle state updated

    applySidebarWidth(on);
    // Show/hide our vault view accordingly
    if (on) {
      // [Production] Toggle ON - Setting up vault sidebar
      // Activate pre-hide CSS and attribute immediately to prevent any flicker
      try {
        document.documentElement.setAttribute("data-sp-alt-view", "1");
        ensurePrehideStyle();
      } catch {}

      // 🚀 NEW VAULT SIDEBAR: Wait for module if needed
      const waitForVaultSidebar = (retriesLeft = 20) => {
        if (window.SuperPromptVaultSidebar) {
          devLog("✅ [VAULT TOGGLE] Using vaultSidebar.js module");
          window.SuperPromptVaultSidebar.show();
        } else if (retriesLeft > 0) {
          devLog(
            `⏳ [VAULT TOGGLE] Waiting for vaultSidebar.js... (${retriesLeft} retries left)`,
          );
          setTimeout(() => waitForVaultSidebar(retriesLeft - 1), 100);
        } else {
          devWarn(
            "⚠️ [VAULT TOGGLE] vaultSidebar.js failed to load after 2 seconds",
          );
        }
      };
      waitForVaultSidebar();
    } else {
      // [Production] Toggle OFF - Tearing down vault sidebar

      // 🚀 NEW VAULT SIDEBAR: Hide cleanly
      if (window.SuperPromptVaultSidebar) {
        devLog("✅ [VAULT TOGGLE] Hiding vault sidebar");
        window.SuperPromptVaultSidebar.hide();
      }

      // Clean up document attributes
      try {
        document.documentElement.removeAttribute("data-sp-alt-view");
      } catch {}
    }
  }

  // Insert a toggle button using the same approach as your colleague
  function ensureToggleButton() {
    // Avoid interfering with React hydration
    if (!canInsertToggle) {
      log("⏳ Delaying toggle insertion until hydration completes");
      return;
    }
    // Check if toggle already exists
    if (document.querySelector("#sp-toggle-container")) {
      log("✅ Toggle container already exists");
      return;
    }

    log("🔍 Adding SuperPrompt toggle as first sidebar element...");

    // Find the sidebar container where we should insert the toggle
    let targetContainer = null;

    // Look for the SIDEBAR nav specifically - ChatGPT's sidebar is on the left side
    // We need to find a nav element that is:
    // 1. Inside the left sidebar area (left side of screen)
    // 2. Contains chat-related navigation (not header nav)

    // First, try to find the sidebar container itself
    const sidebarContainer =
      document.querySelector('div[class*="sidebar"]') ||
      document.querySelector("aside") ||
      document.querySelector('[data-testid="sidebar"]');

    let nav = null;

    if (sidebarContainer) {
      // Look for nav INSIDE the sidebar container
      nav = sidebarContainer.querySelector("nav");
      if (nav) {
        log(`✅ Found nav inside sidebar container`);
      }
    }

    // If not found in sidebar container, try the first nav element
    // (original behavior that worked in Chrome)
    if (!nav) {
      nav = document.querySelector("nav");
      if (nav) {
        log(`✅ Found nav element (fallback)`);
      }
    }

    if (nav) {
      targetContainer = nav;
    } else {
      // Don't fall back to body - skip if no nav found
      log(`⚠️ No nav element found. Skipping toggle insertion.`);
      return;
    }

    // Create a dedicated toggle container that fits naturally in the sidebar
    const toggleContainer = document.createElement("div");
    toggleContainer.id = "sp-toggle-container";
    toggleContainer.setAttribute("data-sp-isolated", "true"); // Prevent React interference
    toggleContainer.style.cssText = [
      "display:flex",
      "align-items:center",
      "justify-content:space-between",
      "padding:8px 16px 8px 12px",
      "margin:0px",
      "gap:12px",
      "border-radius:0",
      "background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.08))",
      "border: 1px solid rgba(59, 130, 246, 0.2)",
      "box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      "backdrop-filter: blur(8px)",
      "isolation:isolate",
      "z-index:1", // Keep low - should stay within sidebar stacking context
      "pointer-events:auto",
      "position:relative",
      "transition: all 0.2s ease",
    ].join(";");

    // Build a left group: logo + title + active indicator
    const leftGroup = document.createElement("div");
    leftGroup.style.cssText = [
      "display:flex",
      "align-items:center",
      "gap:8px",
      "flex:0 0 auto",
    ].join(";");

    // Title block (main title + subtitle for active vault)
    const titleBlock = document.createElement("div");
    titleBlock.style.cssText = [
      "display:flex",
      "flex-direction:column",
      "line-height:1",
      "min-width:0",
    ].join(";");

    const title = document.createElement("span");
    title.textContent = "AIWorkspace Pro";
    title.style.cssText = [
      "color:rgba(255, 255, 255, 0.9)",
      "font-size:14px",
      "font-weight:600",
      "letter-spacing:0.5px",
      "white-space:nowrap",
      "display:block",
      "background: linear-gradient(90deg, #3b82f6, #8b5cf6)",
      "background-clip: text",
      "-webkit-background-clip: text",
      "-webkit-text-fill-color: transparent",
      "text-shadow: none",
    ].join(";");

    // Subtitle for active vault name (will be populated asynchronously)
    const subtitle = document.createElement("span");
    subtitle.id = "sp-active-vault-name";
    subtitle.textContent = ""; // filled later
    subtitle.style.cssText = [
      "color:rgba(156, 163, 175, 0.8)",
      "font-size:11px",
      "font-weight:500",
      "opacity:0.9",
      "white-space:nowrap",
      "overflow:hidden",
      "text-overflow:ellipsis",
      "max-width:160px",
      "margin-top:2px",
    ].join(";");

    titleBlock.appendChild(title);
    titleBlock.appendChild(subtitle);

    // Logo (inline SVG, monochrome currentColor for easy theming)
    const logoWrap = document.createElement("span");
    logoWrap.className = "sp-logo";
    logoWrap.setAttribute("aria-hidden", "true");
    logoWrap.style.cssText = [
      "display:inline-flex",
      "width:30px",
      "height:30px",
      "align-items:center",
      "justify-content:center",
      "transition: transform 0.4s ease",
      "will-change: transform",
    ].join(";");
    logoWrap.innerHTML = `
      <svg width="30" height="30" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AIWorkspace Logo">
        <defs>
          <linearGradient id="sidebar-multi" x1="0" y1="0" x2="64" y2="64">
            <stop offset="0%" stop-color="#00E0C6"/>
            <stop offset="50%" stop-color="#6A5ACD"/>
            <stop offset="100%" stop-color="#1E90FF"/>
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="#1E2230"/>
        <circle cx="32" cy="32" r="30" stroke="white" opacity="0.12" fill="none"/>
        <circle cx="32" cy="32" r="8" stroke="url(#sidebar-multi)" stroke-width="3" fill="none"/>
        <circle cx="32" cy="10" r="3" fill="url(#sidebar-multi)"/>
        <circle cx="32" cy="54" r="3" fill="url(#sidebar-multi)"/>
        <circle cx="10" cy="32" r="3" fill="url(#sidebar-multi)"/>
        <circle cx="54" cy="32" r="3" fill="url(#sidebar-multi)"/>
        <circle cx="14" cy="14" r="3" fill="url(#sidebar-multi)"/>
        <circle cx="50" cy="14" r="3" fill="url(#sidebar-multi)"/>
        <circle cx="14" cy="50" r="3" fill="url(#sidebar-multi)"/>
        <circle cx="50" cy="50" r="3" fill="url(#sidebar-multi)"/>
        <line x1="32" y1="24" x2="32" y2="12" stroke="url(#sidebar-multi)" stroke-width="2.5"/>
        <line x1="32" y1="40" x2="32" y2="52" stroke="url(#sidebar-multi)" stroke-width="2.5"/>
        <line x1="24" y1="32" x2="12" y2="32" stroke="url(#sidebar-multi)" stroke-width="2.5"/>
        <line x1="40" y1="32" x2="52" y2="32" stroke="url(#sidebar-multi)" stroke-width="2.5"/>
        <line x1="27" y1="27" x2="16" y2="16" stroke="url(#sidebar-multi)" stroke-width="2.5"/>
        <line x1="37" y1="27" x2="48" y2="16" stroke="url(#sidebar-multi)" stroke-width="2.5"/>
        <line x1="27" y1="37" x2="16" y2="48" stroke="url(#sidebar-multi)" stroke-width="2.5"/>
        <line x1="37" y1="37" x2="48" y2="48" stroke="url(#sidebar-multi)" stroke-width="2.5"/>
      </svg>
    `;

    // Inject minimal CSS to handle hover color and spin
    try {
      if (!document.getElementById("sp-toggle-style")) {
        const style = document.createElement("style");
        style.id = "sp-toggle-style";
        style.textContent = `
          #sp-toggle-container .sp-logo svg { 
            transition: transform 0.4s ease, filter 0.2s ease;
            will-change: transform;
          }
          #sp-toggle-container:hover .sp-logo svg { 
            transform: rotate(360deg) scale(1.05); 
            filter: brightness(1.2) saturate(1.2) drop-shadow(0 0 8px #00E0C6);
          }
        `;
        document.head.appendChild(style);
      }
    } catch {}

    leftGroup.appendChild(logoWrap);
    leftGroup.appendChild(titleBlock);

    // Create toggle switch (iOS-style)
    const toggleSwitch = document.createElement("label");
    toggleSwitch.style.cssText = [
      "position: relative",
      "display: inline-block",
      "width: 44px",
      "height: 24px",
      "cursor: pointer",
    ].join(";");

    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.style.cssText = ["opacity: 0", "width: 0", "height: 0"].join(
      ";",
    );

    const toggleSlider = document.createElement("span");
    toggleSlider.style.cssText = [
      "position: absolute",
      "cursor: pointer",
      "top: 0",
      "left: 0",
      "right: 0",
      "bottom: 0",
      "background-color: rgba(107, 114, 128, 0.3)",
      "transition: all 0.3s ease",
      "border-radius: 24px",
      "border: 1px solid rgba(107, 114, 128, 0.4)",
    ].join(";");

    const toggleKnob = document.createElement("span");
    toggleKnob.style.cssText = [
      "position: absolute",
      "content: ''",
      "height: 18px",
      "width: 18px",
      "left: 3px",
      "bottom: 2px",
      "background-color: white",
      "transition: all 0.3s ease",
      "border-radius: 50%",
      "box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2)",
    ].join(";");

    toggleSlider.appendChild(toggleKnob);
    toggleSwitch.appendChild(toggleInput);
    toggleSwitch.appendChild(toggleSlider);

    // Set initial state
    const isOn = getAltViewState();
    toggleInput.checked = isOn;

    // Helper function to update toggle visual state
    const updateToggleVisual = (checked) => {
      if (checked) {
        // ON state - green
        toggleSlider.style.backgroundColor = "#10b981";
        toggleSlider.style.borderColor = "#10b981";
        toggleKnob.style.transform = "translateX(20px)";
        toggleSwitch.title = `${t("switchToDefaultView")} (${t(
          "currentWide",
        )})`;
      } else {
        // OFF state - gray
        toggleSlider.style.backgroundColor = "rgba(107, 114, 128, 0.3)";
        toggleSlider.style.borderColor = "rgba(107, 114, 128, 0.4)";
        toggleKnob.style.transform = "translateX(0)";
        toggleSwitch.title = `${t("switchToWideView")} (${t(
          "currentDefault",
        )})`;
      }
    };

    updateToggleVisual(isOn);

    // Add hover effect
    toggleSwitch.addEventListener("mouseenter", () => {
      toggleSlider.style.opacity = "0.9";
      toggleKnob.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
    });

    toggleSwitch.addEventListener("mouseleave", () => {
      toggleSlider.style.opacity = "1";
      toggleKnob.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
    });

    // Add click handler
    toggleInput.addEventListener("change", (e) => {
      e.stopPropagation();

      const newState = toggleInput.checked;

      log("🔄 Toggle switched to:", newState ? "ON" : "OFF");

      setAltViewState(newState);
      updateToggleVisual(newState);
      // Apply the width change
      applySidebarWidth(newState);
    });
    // Assemble the container
    // assemble left group: title + indicator
    leftGroup.appendChild(titleBlock);
    // leftGroup.appendChild(indicator);

    // assemble left group: title + indicator
    leftGroup.appendChild(titleBlock);
    // leftGroup.appendChild(indicator);

    toggleContainer.appendChild(leftGroup);
    // right side: toggle switch
    toggleContainer.appendChild(toggleSwitch);

    // Safer insertion strategy to avoid React conflicts
    try {
      // Insert at the BEGINNING of nav element to appear as first sidebar item
      if (targetContainer === nav && nav.children.length > 0) {
        nav.insertBefore(toggleContainer, nav.firstChild);
        log("✅ Toggle inserted as FIRST element in nav sidebar");
      } else {
        targetContainer.appendChild(toggleContainer);
        log("✅ Toggle appended to target container");
      }

      // Add a persistent class to help with recovery
      toggleContainer.className = "sp-persistent-toggle sp-sidebar-toggle";

      log("✅ SuperPrompt toggle successfully placed in sidebar");
    } catch (e) {
      log("❌ Error inserting toggle button:", e);
      return;
    }

    // CRITICAL: Add toggle button recovery mechanism
    // This ensures the toggle remains visible even after navigation/DOM changes
    // Recovery timer runs indefinitely (no 30s timeout) for persistent monitoring
    setInterval(() => {
      const existingToggle = document.querySelector("#sp-toggle-container");
      if (!existingToggle && canInsertToggle && !isAddingButton) {
        log("🔄 Recovery timer: Toggle missing, attempting restoration...");
        isAddingButton = true;
        setTimeout(() => {
          try {
            ensureToggleButton();
            // Re-apply state after restoration
            if (getAltViewState()) {
              applySidebarWidth(true);
            }
          } catch (e) {
            log("⚠️ Recovery restoration failed:", e);
          } finally {
            isAddingButton = false;
          }
        }, 500);
      }
    }, 3000); // Check every 3 seconds indefinitely

    // Apply current state
    const currentState = getAltViewState();
    if (currentState) {
      // Respect previous ON state
      applySidebarWidth(true);
    } else {
      // Make sure styles are reset if state is OFF
      applySidebarWidth(false);
    }
  }

  function sendPrompt(text = null) {
    // Als er geen tekst is meegegeven, probeer het veld te vinden
    if (!text) {
      const active = document.activeElement;
      const field = isPromptField(active) ? active : findPromptFieldWithText();
      text = extractText(field).trim();
    }

    log("📤 sendPrompt()", text);

    // Filter out note content that might be accidentally detected
    // Check if this looks like note content based on context
    // checkActiveElementInsideDialog returns TRUE if we're in the main prompt area (good)
    // checkActiveElementInsideDialog returns FALSE if we're in a dialog (should filter)
    if (text && !checkActiveElementInsideDialog()) {
      log("⚠️ Filtered out likely dialog/note content:", text);
      return;
    }

    if (text) {
      // Instead of immediately logging, store the pending prompt and wait for actual message to appear
      pendingPromptToLog = {
        text: text,
        timestamp: Date.now(),
        source: "chatgpt",
      };
      log("📋 Stored pending prompt for logging:", text);

      // Set a timeout to clear pending prompt if no message appears within reasonable time
      setTimeout(() => {
        if (pendingPromptToLog && pendingPromptToLog.text === text) {
          log("⏰ Clearing pending prompt (timeout reached):", text);
          pendingPromptToLog = null;
        }
      }, 10000); // 10 second timeout
    } else {
      log("⚠️ Geen geldige prompt gevonden");
    }
  }

  // Function to check if a new message was actually sent and log the pending prompt
  function checkForNewMessage() {
    if (!pendingPromptToLog) return;

    // Look for new user messages that were just added to the chat
    const userMessages = document.querySelectorAll(
      '[data-message-author-role="user"]',
    );

    if (userMessages.length > 0) {
      // Get the most recent user message
      const lastUserMessage = userMessages[userMessages.length - 1];
      const messageText = lastUserMessage.textContent?.trim() || "";

      // Check if this message matches our pending prompt (allowing for some formatting differences)
      const pendingText = pendingPromptToLog.text.trim();
      const messageTimestamp = Date.now();

      // If message content matches and was created recently, log it
      if (
        messageText.includes(pendingText) ||
        pendingText.includes(messageText)
      ) {
        const timeDiff = messageTimestamp - pendingPromptToLog.timestamp;
        if (timeDiff < 15000) {
          // Within 15 seconds
          log("✅ Confirmed message sent, logging prompt:", pendingText);
          window.postMessage(
            {
              type: "chatgpt-prompt-detected",
              prompt: pendingText,
              source: pendingPromptToLog.source,
            },
            "*",
          );
          pendingPromptToLog = null;
        }
      }
    }
  }

  // ████████████████████████████████████████████████████████████████████████████
  // ██              MESSAGE OBSERVER FOR PROMPT LOGGING                       ██
  // ████████████████████████████████████████████████████████████████████████████
  // Observer to detect when new messages are actually added to the chat
  // This triggers checkForNewMessage() to log pending prompts
  const messageObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // Check if any added nodes contain user messages
        let hasNewUserMessage = false;

        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if this node or its children contain a user message
            if (
              node.hasAttribute?.("data-message-author-role") &&
              node.getAttribute("data-message-author-role") === "user"
            ) {
              hasNewUserMessage = true;
            } else if (node.querySelector) {
              const userMsg = node.querySelector('[data-message-author-role="user"]');
              if (userMsg) {
                hasNewUserMessage = true;
              }
            }
          }
        });

        if (hasNewUserMessage) {
          log("🆕 New user message detected, checking pending prompt...");
          setTimeout(checkForNewMessage, 100); // Small delay to ensure message is fully rendered
        }
      }
    });
  });

  // Start observing the document for new messages
  messageObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
  log("✅ Message observer started for prompt logging");

  // Helper function to determine if text looks like a real prompt vs note content
  function checkActiveElementInsideDialog() {
    // Check if we're currently in a dialog context
    const activeElement = document.activeElement;
    if (activeElement) {
      // Check if active element is inside a dialog
      const inDialog =
        activeElement.closest(".generic-dialog") ||
        activeElement.closest("[data-superprompt]") ||
        activeElement.closest('[aria-modal="true"]') ||
        activeElement.closest('[role="dialog"]');

      if (inDialog) {
        log("🔍 Text from dialog context, likely note content");
        return false;
      }
    }

    // Default: assume it's a real prompt
    return true;
  }

  // Vind het veld dat daadwerkelijk tekst bevat
  function findPromptFieldWithText() {
    // ChatGPT may use contenteditable variants like `plaintext-only` (Chrome)
    // so we must not restrict to contenteditable="true" only.
    const form =
      document.querySelector("main form") || document.querySelector("form");
    const scopedEditable = form
      ? [...form.querySelectorAll("[contenteditable], textarea")]
      : [];

    const globalEditable = [
      ...document.querySelectorAll("[contenteditable]"),
      ...document.querySelectorAll("textarea"),
    ];

    const allFields = [
      ...new Set([...scopedEditable, ...globalEditable]),
    ].filter((el) => {
      try {
        // Filter out SuperPrompt UI elements (but keep ChatGPT's prompt-textarea)
        return !(el.closest && el.closest("[data-superprompt]"));
      } catch {
        return true;
      }
    });

    const filteredFields = allFields.filter((field) => {
      try {
        const ce = field.getAttribute?.("contenteditable");
        if (ce === "false") return false;
        return true;
      } catch {
        return true;
      }
    });

    // Zoek het veld met tekst
    for (let i = 0; i < filteredFields.length; i++) {
      const field = filteredFields[i];

      // Additional check: skip fields that look like SuperPrompt inputs (but NOT ChatGPT's)
      try {
        if (field.id && field.id.includes("superprompt")) {
          continue;
        }
        if (field.className && field.className.includes("superprompt")) {
          continue;
        }
      } catch {}

      const text = extractText(field).trim();
      if (text) {
        return field;
      }
    }

    // Fallback: pak het eerste veld (but still avoid SuperPrompt fields)
    return (
      filteredFields.find((field) => {
        try {
          if (field.id && field.id.includes("superprompt")) {
            return false;
          }
          if (field.className && field.className.includes("superprompt")) {
            return false;
          }
          return true;
        } catch {
          return true;
        }
      }) || filteredFields[0]
    );
  }

  // Cache de tekst wanneer er getypt wordt
  function cachePromptText() {
    const field = findPromptFieldWithText();
    if (field) {
      lastPromptText = extractText(field).trim();
    }
  }

  // Helper to detect events originating from SuperPrompt UI (including Shadow DOM)
  function isEventFromSuperPrompt(e) {
    try {
      if (!e) return false;

      // Check if target has data-superprompt directly
      if (
        e.target &&
        e.target.getAttribute &&
        e.target.getAttribute("data-superprompt")
      ) {
        // [Production] Found data-superprompt on target
        return true;
      }

      // Prefer composedPath when available to traverse shadow boundaries
      const path = typeof e.composedPath === "function" ? e.composedPath() : [];
      // [Production] Checking composedPath

      for (const node of path) {
        try {
          if (
            node &&
            node.getAttribute &&
            node.getAttribute("data-superprompt")
          ) {
            // [Production] Found data-superprompt in path
            return true;
          }
        } catch {}
      }

      // Fallback checks
      const t = e.target;
      if (t && t.closest && t.closest("[data-superprompt]")) {
        // [Production] Found via closest on target
        return true;
      }

      const ae = document.activeElement;
      if (ae && ae.closest && ae.closest("[data-superprompt]")) {
        // [Production] Found via closest on activeElement
        return true;
      }

      // Additional check for GenericDialog specific classes/selectors and our note sidebar
      if (
        t &&
        t.closest &&
        (t.closest(".generic-dialog") ||
          t.closest("[class*='dialog']") ||
          t.closest("[aria-modal='true']") ||
          t.closest(".sp-note-sidebar"))
      ) {
        // [Production] Found via dialog class checks
        return true;
      }

      // [Production] No SuperPrompt UI detected
    } catch (err) {
      // [Production] Error in isEventFromSuperPrompt
    }
    return false;
  }

  // ⌨️ ENTER zonder shift → sendPrompt
  document.addEventListener(
    "keydown",
    (e) => {
      // Ignore key events originating in SuperPrompt UI (including shadow DOM)
      if (isEventFromSuperPrompt(e)) return;
      if (e.key === "Enter" && !e.shiftKey) {
        log("⏎ ENTER → sendPrompt");
        sendPrompt();
      }
    },
    true,
  );

  // 🖱️ Klik op verzendknop → sendPrompt (met cached tekst)
  document.addEventListener(
    "click",
    function (e) {
      const el = e.target;

      // Ignore clicks originating from SuperPrompt UI (e.g., notes sidebar/buttons)
      if (isEventFromSuperPrompt(e)) return;

      // Meer uitgebreide send button detectie
      const isSendButton =
        el?.closest('button[id="composer-submit-button"]') ||
        el?.closest('button[data-testid="send-button"]') ||
        el?.closest('[data-testid^="send"]') ||
        el?.closest('button[aria-label*="Send"]') ||
        el?.closest('button[aria-label*="Verzenden"]') ||
        el?.closest('button[type="submit"]') ||
        (el?.closest('[role="button"]') &&
          el?.closest('[role="button"]').textContent?.includes("↵")) ||
        (el?.matches("button") && el.querySelector("svg")) ||
        (el?.closest("button") && el?.closest("button").querySelector("svg"));

      if (isSendButton) {
        log("🖱️ Klik op verzendknop gedetecteerd");

        // DEBUG: Laat alle velden zien
        debugFields();

        // Probeer eerst de huidige tekst te lezen
        const field = findPromptFieldWithText();
        const currentText = field ? extractText(field).trim() : "";

        // Don't fall back to cached text to avoid logging stale note content
        const textToSend = currentText;

        log("📝 Huidige tekst:", currentText);
        // log("💾 Cached tekst:", lastPromptText);
        log("📤 Versturen:", textToSend);

        if (textToSend) {
          sendPrompt(textToSend);
        }
      }
    },
    true,
  ); // Gebruik capture fase

  // Cache tekst bij input events (guarded against SuperPrompt UI)
  document.addEventListener(
    "input",
    (e) => {
      if (isEventFromSuperPrompt(e)) return;
      cachePromptText();
    },
    true,
  );
  document.addEventListener(
    "paste",
    (e) => {
      if (isEventFromSuperPrompt(e)) return;
      // Wacht even tot de paste is verwerkt
      setTimeout(cachePromptText, 10);
    },
    true,
  );

  // Extra events voor verschillende input types
  document.addEventListener(
    "keyup",
    (e) => {
      if (isEventFromSuperPrompt(e)) return;
      cachePromptText();
    },
    true,
  );
  document.addEventListener(
    "change",
    (e) => {
      if (isEventFromSuperPrompt(e)) return;
      cachePromptText();
    },
    true,
  );

  // Manual caching op focus/blur
  document.addEventListener(
    "focus",
    (e) => {
      if (isPromptField(e.target)) {
        cachePromptText();
      }
    },
    true,
  );

  document.addEventListener(
    "blur",
    (e) => {
      if (isPromptField(e.target)) {
        cachePromptText();
      }
    },
    true,
  );

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                           USER DETECTION                               ██
  // ██                                                                        ██
  // ██  Automatic ChatGPT user account detection and backend registration:    ██
  // ██  • getAccountFromBackendAPI() - Fetch ChatGPT session information      ██
  // ██  • extractChatGPTUserInfo() - Parse user data from ChatGPT             ██
  // ██  • attemptUserDetection() - Main detection logic with retries          ██
  // ██  • initializeUserDetection() - Start detection on page load            ██
  // ██  • Automatic user registration with SuperPrompt backend               ██
  // ██                                                                        ██
  // ██  Lines: 5890-6500                                                      ██
  // ██████████████████████████████████████████████████████████████████████████████

  // ================= ChatGPT User Auto-Detection & Registration =================
  // Automatically detect ChatGPT user info and send to Railway backend
  // This implements the SuperPower ChatGPT pattern for automatic user registration

  let userInfoSent = false;
  let userDetectionAttempts = 0;
  const MAX_USER_DETECTION_ATTEMPTS = 10;

  // Function to get access token from ChatGPT

  // Function to get account info from ChatGPT backend API
  async function getAccountFromBackendAPI() {
    try {
      log("🔍 Fetching account info from ChatGPT session API...");

      const response = await fetch("https://chatgpt.com/api/auth/session", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        log("✅ Got session data from ChatGPT:", data);

        // Extract user info from session data
        const user = data.user;
        const account = data.account;

        if (user) {
          const userInfo = {
            id: user.id || account?.account_id || "unknown", // Changed from openai_id to id
            openai_id: user.id || account?.account_id || "unknown",
            email: user.email || null,
            name: user.name || user.first_name || "ChatGPT User",
            avatar: user.image || user.picture || null,
            plus: account?.plan_type === "plus" || false,
            plan_type: account?.plan_type || "free",
            version: "1.0.0",
            user_agent: navigator.userAgent,
          };

          log("🚀 FINAL USER INFO WITH EMAIL FROM SESSION:", userInfo);
          return userInfo;
        }

        if (data.accounts && data.accounts.default) {
          const account = data.accounts.default;
          return {
            id: account.account_id,
            email: account.email,
            name: account.name || account.email?.split("@")[0],
            picture: account.picture,
            plus: account.entitlement?.has_active_subscription || false,
            accessToken: accessToken,
          };
        }
      } else {
        log(
          "❌ Backend API request failed:",
          response.status,
          response.statusText,
        );
      }

      return null;
    } catch (error) {
      logError("❌ Error fetching account from backend API:", error);
      return null;
    }
  }

  // Function to extract ChatGPT user information from the page
  async function extractChatGPTUserInfo() {
    try {
      log("🔍 Starting user extraction with multiple strategies...");

      // Strategy 0: Try ChatGPT Backend API first (most reliable)
      const backendUser = await getAccountFromBackendAPI();
      if (backendUser) {
        log("✅ Found user data from ChatGPT Backend API:", backendUser);
        return backendUser;
      }

      // Strategy 1: Debug - log what's available
      log("🔍 Debug - window.__NEXT_DATA__:", !!window?.__NEXT_DATA__);
      log("🔍 Debug - localStorage keys:", Object.keys(localStorage));

      // Strategy 2: Check for user data in ChatGPT's store/state
      const userDataStore = window?.__NEXT_DATA__?.props?.pageProps?.user;
      if (userDataStore) {
        log("✅ Found user data in __NEXT_DATA__:", userDataStore);
        return {
          id: userDataStore.id,
          email: userDataStore.email,
          name: userDataStore.name,
          picture: userDataStore.picture,
          plus: userDataStore.groups?.includes("chatgpt_plus") || false,
        };
      } else {
        log("❌ No user data in __NEXT_DATA__");
      }

      // Strategy 3: Check localStorage for ChatGPT session data
      const possibleKeys = [
        "session",
        "user",
        "auth",
        "chatgpt-user",
        "oai-user",
        "oai-session",
      ];
      for (const key of possibleKeys) {
        const sessionData = localStorage.getItem(key);
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            log(`🔍 Checking localStorage key '${key}':`, parsed);

            if (parsed.user) {
              log("✅ Found user data in localStorage session:", parsed.user);
              return {
                id: parsed.user.id,
                email: parsed.user.email,
                name: parsed.user.name,
                picture: parsed.user.picture,
                plus: parsed.user.groups?.includes("chatgpt_plus") || false,
              };
            }
          } catch (e) {
            log(`⚠️ Failed to parse localStorage ${key}:`, e);
          }
        }
      }

      // Strategy 3.5: Extract user ID from cache keys (like cache/user-ulN9n0rvVw0vp7fKaywCXS56/...)
      const cacheKeys = Object.keys(localStorage).filter((key) =>
        key.startsWith("cache/user-"),
      );
      if (cacheKeys.length > 0) {
        const cacheKey = cacheKeys[0];
        const userIdMatch = cacheKey.match(/cache\/user-([a-zA-Z0-9]+)\//);
        if (userIdMatch) {
          const userId = userIdMatch[1];
          log(`✅ Found user ID from cache key: ${userId}`);

          // Try to get more user info from other localStorage keys
          const chatThemeKey = `oai/apps/chatTheme/user-${userId}`;
          const hasTheme = localStorage.getItem(chatThemeKey);

          if (hasTheme) {
            log(`✅ Confirmed user ${userId} is active (has chat theme)`);
            return {
              id: userId,
              email: null, // Will need to get from API
              name: "ChatGPT User",
              picture: null,
              plus: detectPlusSubscription(),
            };
          }
        }
      }

      // Strategy 4: Check for user avatar/profile elements in DOM
      const profileSelectors = [
        '[data-testid="profile-button"]',
        'button[aria-label*="Profile"]',
        'button[aria-label*="Account"]',
        'button[aria-label*="User"]',
        "[data-headlessui-state] img",
        'nav img[alt*="user"]',
        ".avatar img",
        'button img[src*="user"]',
      ];

      for (const selector of profileSelectors) {
        const profileButton = document.querySelector(selector);
        if (profileButton) {
          log(
            `🔍 Found profile element with selector: ${selector}`,
            profileButton,
          );

          const img =
            profileButton.tagName === "IMG"
              ? profileButton
              : profileButton.querySelector("img");
          const avatarUrl = img?.src;

          if (avatarUrl) {
            log("✅ Found user avatar in DOM:", avatarUrl);

            // Try to extract user ID from avatar URL pattern
            const idMatch = avatarUrl.match(/user-([a-zA-Z0-9]+)/);
            const userId = idMatch ? idMatch[1] : `user-${Date.now()}`;

            return {
              id: userId,
              email: null, // Will need to get from API call
              name: profileButton.getAttribute("aria-label") || "ChatGPT User",
              picture: avatarUrl,
              plus: detectPlusSubscription(),
            };
          }
        }
      }

      // Strategy 5: Look for any user indicators in the page
      const userIndicators = document.querySelectorAll(
        "[data-testid], [aria-label], [title]",
      );
      for (const element of userIndicators) {
        const text =
          element.textContent ||
          element.getAttribute("aria-label") ||
          element.getAttribute("title") ||
          "";
        if (text.includes("@") && text.includes(".")) {
          log("✅ Found potential email in page:", text);
          return {
            id: `user-${Date.now()}`,
            email: text.trim(),
            name: text.split("@")[0],
            picture: null,
            plus: detectPlusSubscription(),
          };
        }
      }

      // Strategy 6: FIRST check if user is logged OUT (this is the most reliable check!)
      const loginSelectors = [
        'button[data-testid="login-button"]',
        'button[data-testid="signup-button"]',
        'a[href*="/auth/login"]',
        'button:has-text("Log in")',
        'button:has-text("Sign up")',
        'button[aria-label*="Log in"]',
        'button[aria-label*="Sign in"]',
        'button[aria-label*="Sign up"]',
      ];

      for (const selector of loginSelectors) {
        // Use more robust check - look for visible login/signup buttons in header
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          // Check if element is visible and in the top area of the page
          const rect = element.getBoundingClientRect();
          if (rect.top < 100 && rect.width > 0 && rect.height > 0) {
            log(
              "❌ User is NOT logged in - found visible login/signup button in header",
            );
            return null;
          }
        }
      }

      // Also check for "Log in" or "Sign up" text in buttons at the top
      const allButtons = document.querySelectorAll("button");
      for (const button of allButtons) {
        const text = button.textContent?.trim().toLowerCase() || "";
        const rect = button.getBoundingClientRect();
        if (rect.top < 100 && rect.width > 0 && rect.height > 0) {
          if (
            text === "log in" ||
            text === "sign in" ||
            text === "sign up" ||
            text === "sign up for free"
          ) {
            log(
              `❌ User is NOT logged in - found "${button.textContent}" button in header`,
            );
            return null;
          }
        }
      }

      // Strategy 7: ONLY create minimal user if we have strong logged-in indicators AND no login buttons
      const loggedInIndicators = [
        'button[aria-label*="New chat"]',
        '[data-testid="new-chat"]',
      ];

      for (const selector of loggedInIndicators) {
        if (document.querySelector(selector)) {
          log(
            "✅ User appears to be logged in (found logged-in indicators), creating minimal user",
          );
          return {
            id: `user-${Date.now()}`,
            email: null,
            name: "ChatGPT User",
            picture: null,
            plus: detectPlusSubscription(),
          };
        }
      }

      log("⚠️ No ChatGPT user data found with any strategy");
      return null;
    } catch (error) {
      logError("❌ Error extracting ChatGPT user info:", error);
      return null;
    }
  }

  // Function to detect ChatGPT Plus subscription status
  function detectPlusSubscription() {
    try {
      // Check for Plus indicators in the UI
      const plusIndicators = [
        'text*="Plus"',
        'text*="Pro"',
        '[data-testid*="plus"]',
        ".text-orange-500", // ChatGPT Plus orange color
        '[title*="Plus"]',
        '[aria-label*="Plus"]',
      ];

      for (const selector of plusIndicators) {
        if (document.querySelector(selector)) {
          log("✅ ChatGPT Plus subscription detected via UI");
          return true;
        }
      }

      // Check localStorage for subscription status
      const subscriptionData =
        localStorage.getItem("subscription") ||
        localStorage.getItem("user_subscription") ||
        localStorage.getItem("chatgpt_subscription");

      if (subscriptionData) {
        try {
          const parsed = JSON.parse(subscriptionData);
          if (
            parsed.plan === "plus" ||
            parsed.type === "plus" ||
            parsed.active
          ) {
            log("✅ ChatGPT Plus subscription detected via localStorage");
            return true;
          }
        } catch (e) {
          log("⚠️ Failed to parse subscription data:", e);
        }
      }

      log("ℹ️ No ChatGPT Plus subscription detected");
      return false;
    } catch (error) {
      log("❌ Error detecting Plus subscription:", error);
      return false;
    }
  }

  // Function to get browser/device info (like SuperPower ChatGPT)
  function getBrowserInfo() {
    try {
      return {
        appCodeName: navigator.appCodeName,
        connectionDownlink: navigator?.connection?.downlink,
        connectionEffectiveType: navigator?.connection?.effectiveType,
        deviceMemory: navigator.deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
        language: navigator.language,
        platform: navigator.platform,
        userAgent: navigator.userAgent,
      };
    } catch (error) {
      log("❌ Error getting browser info:", error);
      return {};
    }
  }

  // Function to send user registration to Railway backend via content script
  function sendUserRegistrationToBackend(userInfo) {
    try {
      if (!userInfo || userInfoSent) {
        return;
      }

      const registrationData = {
        openai_id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name || userInfo.email || "ChatGPT User",
        avatar: userInfo.picture,
        plus: userInfo.plus || detectPlusSubscription(),
        navigator: getBrowserInfo(),
        version: "1.0.0", // Extension version
        total_conversations: 0, // Will be updated by backend
        multiple_accounts: false, // Single account for now
      };

      log("📤 Sending user registration to Railway backend:", registrationData);

      // Send to content script which will forward to background script and Railway API
      window.postMessage(
        {
          type: "chatgpt-user-detected",
          userInfo: registrationData,
          source: "chatgpt-injected",
        },
        "*",
      );

      userInfoSent = true;
      log("✅ User registration sent to content script");
    } catch (error) {
      log("❌ Error sending user registration:", error);
    }
  }

  // Function to attempt user detection with retries
  async function attemptUserDetection() {
    if (userInfoSent || userDetectionAttempts >= MAX_USER_DETECTION_ATTEMPTS) {
      // If we've exhausted all attempts and still no user, send "not logged in" message
      if (
        !userInfoSent &&
        userDetectionAttempts >= MAX_USER_DETECTION_ATTEMPTS
      ) {
        log("❌ User not detected after all attempts - user not logged in");
        window.postMessage(
          {
            type: "chatgpt-user-not-detected",
            source: "chatgpt-injected",
          },
          "*",
        );
      }
      return;
    }

    userDetectionAttempts++;
    log(
      `🔍 Attempting ChatGPT user detection (attempt ${userDetectionAttempts}/${MAX_USER_DETECTION_ATTEMPTS})`,
    );

    // First, try to extract the real user info from ChatGPT APIs
    const userInfo = await extractChatGPTUserInfo();
    if (userInfo && userInfo.id) {
      log("✅ ChatGPT user detected successfully:", userInfo);
      sendUserRegistrationToBackend(userInfo);
      return;
    }

    // Fallback: if the profile button is visible, we know user is logged in
    // but we couldn't extract their real ID. Don't send a synthetic ID -
    // just mark as logged in without an API-usable ID.
    try {
      const profileButton = document.querySelector(
        '[data-testid="accounts-profile-button"]',
      );

      if (profileButton) {
        log(
          "⚠️ Profile button detected but couldn't extract real user ID - user is logged in but API sync unavailable",
        );

        // Send a minimal "user detected" event to mark user as logged in,
        // but WITHOUT an openai_id so it won't be used for API calls
        window.postMessage(
          {
            type: "chatgpt-user-logged-in-no-id",
            source: "chatgpt-injected",
          },
          "*",
        );
        return;
      }
    } catch (e) {
      log("⚠️ Error while checking accounts-profile-button:", e);
    }

    // No user info and no profile button - retry
    log(
      `⚠️ User detection attempt ${userDetectionAttempts} failed, retrying in 2 seconds...`,
    );

    // Retry with exponential backoff
    const delay = Math.min(2000 * userDetectionAttempts, 10000);
    setTimeout(attemptUserDetection, delay);
  }

  // Initialize user detection when page loads
  function initializeUserDetection() {
    log("🚀 Initializing ChatGPT user auto-detection...");

    // Start detection immediately
    attemptUserDetection();

    // Also try again after a short delay in case page is still loading
    setTimeout(attemptUserDetection, 1000);
    setTimeout(attemptUserDetection, 3000);
    setTimeout(attemptUserDetection, 5000);
  }

  // Initialize note tab functionality and user detection
  document.addEventListener("DOMContentLoaded", () => {
    // Note tab now handled by notesManager.js module
    setupContentObserver();
    installUrlHooks();
    startManagerWatcher();
    initializeUserDetection(); // Add user detection initialization
  });

  // Also initialize immediately if document is already ready
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    log("🚀 Document already ready, initializing user detection immediately");
    initializeUserDetection();
  } else {
    log("🚀 Document not ready, waiting for DOMContentLoaded");
  }

  // Also initialize after a short delay as fallback
  setTimeout(() => {
    if (!userInfoSent) {
      log("🚀 Fallback: Starting user detection after 2 seconds");
      initializeUserDetection();
    }
  }, 2000);

  // Watch for URL changes and navigation with less aggressive polling
  let urlWatchInterval = null;

  function startUrlWatching() {
    if (urlWatchInterval) return;
    // Increase interval to reduce CPU load during navigation
    urlWatchInterval = setInterval(watchForUrlChanges, 1000); // Back to 1000ms to reduce interference
  }

  function stopUrlWatching() {
    if (urlWatchInterval) {
      clearInterval(urlWatchInterval);
      urlWatchInterval = null;
    }
  }

  // Start watching
  startUrlWatching();

  // Also initialize on load
  if (document.readyState === "complete") {
    setTimeout(() => {
      // Note tab now handled by notesManager.js module
      setupContentObserver();
      installUrlHooks();
      startManagerWatcher();
    }, 500); // Reduced delay
  } else {
    window.addEventListener("load", () => {
      setTimeout(() => {
        // Note tab now handled by notesManager.js module
        setupContentObserver();
        installUrlHooks();
        startManagerWatcher();
      }, 500); // Reduced delay
    });
  }

  // Enhanced page visibility change handler for better SPA navigation
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      // Page became visible, check if we need to update note tab
      setTimeout(() => {
        // Only reinitialize if page was actually hidden and is now visible
        // Don't trigger on focus changes from dropdowns/modals
        if (
          document.hidden === false &&
          document.visibilityState === "visible"
        ) {
          const conversationId = getCurrentConversationId();
          const existingTab = document.querySelector(".sp-note-tab");

          if (conversationId && !existingTab) {
            log("👁️ Page visibility changed, reinitializing note tab");
            // Note tab now handled by notesManager.js module
          }
        }
      }, 500); // Increased delay to avoid rapid triggers
    }
  });

  // Observer voor DOM veranderingen (als ChatGPT dynamisch content laadt)
  let isAddingButton = false; // Prevent infinite loops
  let toggleCheckCount = 0;
  const MAX_TOGGLE_CHECKS = 50; // Higher limit for better recovery
  let lastToggleCheckReset = Date.now();
  const TOGGLE_CHECK_RESET_INTERVAL = 10000; // Reset counter every 10s

  function isCacheFresh() {
    try {
      return !!(
        lastDataKey && Date.now() - lastDataTimestamp < DATA_CACHE_DURATION
      );
    } catch {
      return false;
    }
  }

  let navStabilized = false;
  const observer = new MutationObserver((mutations) => {
    // Skip if we're currently adding a button
    if (isAddingButton) return;
    // Skip during conversation navigation to reduce overhead
    if (navSessionActive) return;

    let shouldCheckToggle = false;
    let hasNavChanges = false;

    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        // Check of er nieuwe prompt velden zijn toegevoegd
        const promptField = document.querySelector(
          "[contenteditable], textarea",
        );
        if (promptField && !promptField.hasAttribute("data-listener-added")) {
          promptField.setAttribute("data-listener-added", "true");
          promptField.addEventListener("input", cachePromptText);
          promptField.addEventListener("paste", () => {
            setTimeout(cachePromptText, 10);
          });

          // Initialize quick access menu event listeners for this field
          // Quick Access Menu is now handled by quickAccessMenu.js module
          // Legacy initialization code removed
        }

        // Check for nav-related changes specifically
        if (mutation.target) {
          const isNavArea =
            mutation.target.tagName === "NAV" ||
            mutation.target.closest("nav") ||
            mutation.target.querySelector("nav");

          if (isNavArea && !navStabilized) {
            hasNavChanges = true;
          }

          // Check if sidebar structure changed (but not from our own button addition)
          if (
            !mutation.target.classList?.contains("sp-alt-toggle") &&
            !mutation.target.closest?.("[data-sp-shadow-host]")
          ) {
            shouldCheckToggle = true;
          }
        }
      }
    });

    // Notes tab guard: schedule check instead of doing IndexedDB work on every mutation
    try {
      if (typeof window._spScheduleNotesTabGuardCheck === "function") {
        window._spScheduleNotesTabGuardCheck();
      }
    } catch {}

    // Periodic reset of toggleCheckCount to allow continuous monitoring
    const now = Date.now();
    if (now - lastToggleCheckReset > TOGGLE_CHECK_RESET_INTERVAL) {
      toggleCheckCount = 0;
      lastToggleCheckReset = now;
      navStabilized = false; // Also reset nav stabilization periodically
    }

    // Enhanced toggle checking with priority for nav changes
    if (
      canInsertToggle &&
      (shouldCheckToggle || hasNavChanges) &&
      toggleCheckCount < MAX_TOGGLE_CHECKS
    ) {
      isAddingButton = true;
      toggleCheckCount++;

      try {
        // Extra check: only proceed if toggle is actually missing
        if (!document.querySelector("#sp-toggle-container")) {
          log("🔄 DOM changed and toggle missing, attempting to restore...");
          ensureToggleButton();

          // Re-apply width if toggle is on
          if (getAltViewState()) {
            applySidebarWidth(true);
          }
          // After first successful insertion, mark nav as stabilized to prevent thrash
          navStabilized = true;
        } else {
          // Toggle exists - reset counter to allow future checks
          toggleCheckCount = Math.max(0, toggleCheckCount - 1);
          // If toggle exists and widths are set, mark as stable but don't block future checks
          if (hasNavChanges) {
            navStabilized = true;
          }
        }
      } catch (e) {
        // Silently fail if sidebar not ready yet
        log("⚠️ Toggle restoration failed:", e);
      } finally {
        setTimeout(() => {
          isAddingButton = false;
        }, 100);
      }
    }

    // CRITICAL: Always check for missing toggle, even if other conditions aren't met
    // This is a safety net that runs less frequently
    if (canInsertToggle && toggleCheckCount % 10 === 0) {
      const toggleExists = document.querySelector("#sp-toggle-container");
      if (!toggleExists && !isAddingButton) {
        log("⚠️ Periodic check: Toggle missing, forcing restoration...");
        isAddingButton = true;
        try {
          ensureToggleButton();
          if (getAltViewState()) {
            applySidebarWidth(true);
          }
        } catch (e) {
          log("❌ Forced toggle restoration failed:", e);
        } finally {
          setTimeout(() => {
            isAddingButton = false;
          }, 100);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Observer to detect when new messages are actually added to the chat
  // ██████████████████████████████████████████████████████████████████████████████
  // ██  🗑️ LEGACY VAULT WATCHERS REMOVED                                      ██
  // ██                                                                        ██
  // ██  The following legacy Vault sidebar code has been removed:            ██
  // ██  • messageObserver - Monitored for new user messages (~35 lines)      ██
  // ██  • startVaultInitWatchdog() - Timer-based reinitialization (~45 lines)██
  // ██                                                                        ██
  // ██  All vault functionality is now handled by vaultSidebar.js module.    ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Enhanced initial setup - multiple attempts to ensure toggle button
  function attemptToggleSetup(attempt = 1, maxAttempts = 5) {
    try {
      log(`🚀 Toggle setup attempt ${attempt}/${maxAttempts}...`);

      // Check if nav exists and is ready
      const nav = document.querySelector("nav");
      if (!nav) {
        if (attempt < maxAttempts) {
          log(`⏳ Nav not ready, retrying in ${attempt * 200}ms...`);
          setTimeout(
            () => attemptToggleSetup(attempt + 1, maxAttempts),
            attempt * 200,
          );
        } else {
          log("❌ Max attempts reached, nav element not found");
        }
        return;
      }

      // Check if toggle already exists
      if (document.querySelector("#sp-toggle-container")) {
        log("✅ Toggle already exists, no need to create");
        return;
      }

      ensureToggleButton();
      log(`✅ Toggle setup successful on attempt ${attempt}`);
    } catch (e) {
      if (attempt < maxAttempts) {
        log(
          `⚠️ Toggle setup attempt ${attempt} failed:`,
          e,
          `retrying in ${attempt * 300}ms...`,
        );
        setTimeout(
          () => attemptToggleSetup(attempt + 1, maxAttempts),
          attempt * 300,
        );
      } else {
        log("❌ All toggle setup attempts failed:", e);
      }
    }
  }

  // Defer initial attempt until after hydration to avoid React recoverable hydration warnings
  if (document.readyState === "complete") {
    setTimeout(() => {
      canInsertToggle = true;
      attemptToggleSetup(1, 5);
    }, 250);
  }

  // Additional safety net - check again after page load events
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      // Small delay post-DCL to let React hydrate
      setTimeout(() => {
        canInsertToggle = true;
        attemptToggleSetup(1, 5);
      }, 250);
    });
  }

  window.addEventListener("load", () => {
    setTimeout(() => {
      canInsertToggle = true;
      if (!document.querySelector("#sp-toggle-container")) {
        log(
          "🔄 Window load safety check - toggle missing, attempting setup...",
        );
        attemptToggleSetup(1, 5);
      }
    }, 600);
  });

  log("✅ ChatGPT listener actief met caching en sidebar toggle");

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                      EVENT LISTENERS & KEYBOARD                        ██
  // ██                                                                        ██
  // ██  Global event handling for user interactions and page monitoring:      ██
  // ██  • Document click handlers for menu dismissal                          ██
  // ██  • Keydown listeners for slash commands and navigation                 ██
  // ██  • Input field monitoring for prompt detection and caching             ██
  // ██  • URL change monitoring and navigation safety                         ██
  // ██  • Window resize and focus/blur handlers                               ██
  // ██                                                                        ██
  // ██  Lines: 6690-8000                                                      ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Conversation width logic moved to separate module chatgpt-convo-width.js

  // ================= Vault Sidebar View (Read-only) =================
  let spShadowHost = null;
  let spShadowRoot = null;
  let spTreeRoot = null;
  let lastDataKey = "";
  let lastDataTimestamp = 0;
  const DATA_CACHE_DURATION = 5000; // 5 seconds cache
  // Watcher for active vault changes
  let activeVaultWatchTimer = null;
  let lastObservedActiveVaultId = null;
  // Search state for filtering chats
  let currentSearchQuery = "";
  let searchDebounceTimer = null;
  let lastPayload = null;
  // Deferral flag if a conversation load overlay is active during our render
  let pendingVaultRerender = false;

  function isVaultHostAttached() {
    // 🗑️ DELETED: Vault sidebar now handled by vaultSidebar.js module
    return false;
  }

  // Global theme tracking
  let globalCurrentTheme = "light";
  let vaultThemeObserver = null;

  // Enhanced theme detection function (global)
  function detectCurrentTheme() {
    const htmlElement = document.documentElement;

    // Method 1: Check data-theme attribute (most reliable for your multi-theme system)
    const dataTheme = htmlElement.getAttribute("data-theme");
    if (dataTheme) {
      return dataTheme;
    }

    // Method 2: Check for dark class on html element (ChatGPT default)
    if (htmlElement.classList.contains("dark")) {
      return "dark";
    }

    // Method 3: Check body class for theme indicators
    if (document.body && document.body.classList.contains("dark")) {
      return "dark";
    }

    // Method 4: Look for ChatGPT-specific theme indicators
    const chatContainer =
      document.querySelector('[data-testid="chat-container"]') ||
      document.querySelector(".flex.h-full.flex-col") ||
      document.querySelector("main");
    if (chatContainer) {
      const computedStyle = window.getComputedStyle(chatContainer);
      const bgColor = computedStyle.backgroundColor;
      // Check if background is dark
      if (bgColor.includes("rgb")) {
        const rgb = bgColor.match(/\d+/g);
        if (rgb) {
          const [r, g, b] = rgb.map(Number);
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          if (brightness < 128) {
            return "dark";
          }
        }
      }
    }

    // Method 5: System preference fallback
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    return "light";
  }

  // Theme change observer
  function setupThemeObserver() {
    if (vaultThemeObserver) {
      vaultThemeObserver.disconnect();
    }

    vaultThemeObserver = new MutationObserver((mutations) => {
      let shouldCheckTheme = false;

      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName === "class" ||
            mutation.attributeName === "data-theme")
        ) {
          shouldCheckTheme = true;
        }
      });

      if (shouldCheckTheme) {
        const newTheme = detectCurrentTheme();
        if (newTheme !== globalCurrentTheme) {
          // [Production] Theme changed
          globalCurrentTheme = newTheme;

          // Refresh vault view if active
          if (isToggleOn && spShadowHost) {
            // [Production] Console log removed
            setTimeout(() => {
              ensureShadowContainer();
            }, 100);
          }
        }
      }
    });

    // Observe both html and body for theme changes
    vaultThemeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
      subtree: false,
    });

    if (document.body) {
      vaultThemeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
        subtree: false,
      });
    }
  }

  // Initialize theme tracking and toggle state
  globalCurrentTheme = detectCurrentTheme();
  isToggleOn = getAltViewState();
  setupThemeObserver();
  // If alt view already ON, pre-activate attribute + prehide CSS ASAP
  if (isToggleOn) {
    try {
      document.documentElement.setAttribute("data-sp-alt-view", "1");
      ensurePrehideStyle();
      // Also ensure hide-asides CSS is available immediately
      ensureHideAsidesStyle();
    } catch {}
  } else {
    // Even if toggle is off, inject the CSS so it's ready when needed
    try {
      ensureHideAsidesStyle();
    } catch {}
  }

  function ensureShadowContainer() {
    // 🗑️ DELETED: Vault sidebar now handled by vaultSidebar.js module
    return null;
  }

  // 🔒 DEBOUNCE: Prevent infinite loop - track last render attempt
  let lastRenderRequestTime = 0;
  let isRenderInProgress = false;
  const RENDER_DEBOUNCE_MS = 2000; // Minimum 2 seconds between renders

  function requestVaultSidebarDataAndRender() {
    // 🗑️ DELETED: Vault sidebar now handled by vaultSidebar.js module
    return Promise.resolve();
  }

  async function renderVaultSidebarView() {
    // 🗑️ DELETED: Vault sidebar now handled by vaultSidebar.js module
    return;
  }

  function readActiveVaultId() {
    try {
      return localStorage.getItem("activeVaultId") || "";
    } catch {
      return "";
    }
  }

  function onActiveVaultChanged(newId) {
    // Skip if view is not active
    if (!getAltViewState()) return;
    if (newId === lastObservedActiveVaultId) return;
    lastObservedActiveVaultId = newId;
    // 🔒 PROTECTION: Add debouncing to prevent rapid re-renders
    if (isRenderInProgress) {
      log("📋 Active vault change ignored - render already in progress");
      return;
    }
    // Bust cache and re-render immediately
    lastDataKey = "";
    lastDataTimestamp = 0;
    try {
      // Vault rendering now handled by vaultSidebar.js module
    } catch {}
  }

  // Optional: listen for explicit messages if UI broadcasts vault changes
  window.addEventListener("message", (e) => {
    const msg = e?.data;
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "sp-active-vault-changed") {
      onActiveVaultChanged(String(msg.vaultId || ""));
    }
    // React to settings toggles from main UI
    if (msg.type === "sp-sidebar-settings-changed") {
      try {
        if (lastPayload) renderTree(lastPayload);
      } catch {}
    }
  });

  // If toggle already ON on load, render immediately
  // 🚫 LEGACY: Now handled by vaultSidebar.js module
  if (getAltViewState() && USE_LEGACY_VAULT_SIDEBAR) {
    // Render quickly to minimize any flicker
    setTimeout(() => {
      try {
        try {
          // Vault rendering now handled by vaultSidebar.js module
        } catch {}
      } catch (e) {
        log("⚠️ Deferred renderVaultSidebarView failed:", e);
      }
    }, 50);
    // Kick off watchdog as additional safety after load
    setTimeout(() => {
      try {
        startVaultInitWatchdog();
      } catch {}
    }, 600);
  }

  // Re-render on DOM changes if our view is active (with faster recovery) - only if observers not disabled
  // 🚫 LEGACY: Now handled by vaultSidebar.js module
  let vaultViewDebounceTimer = null;
  if (!DISABLE_MUTATION_OBSERVERS && USE_LEGACY_VAULT_SIDEBAR) {
    const vaultViewObserver = new MutationObserver((mutations) => {
      // 🚨 SMART SAFETY: Skip during new chat creation (now uses coreUtils module)
      if (window.SuperPromptCoreUtils && !window.SuperPromptCoreUtils.isSafeToOperate()) {
        return;
      }

      if (!getAltViewState()) return;
      // Skip during navigation
      if (navSessionActive) return;

      // Check if mutations are relevant (avoid triggering on our own changes)
      const isRelevant = mutations.some((mutation) => {
        // Skip if mutation is in our shadow DOM
        if (
          mutation.target &&
          mutation.target.closest &&
          mutation.target.closest("[data-sp-shadow-host]")
        ) {
          return false;
        }
        // Only care about structural changes that might affect the chat list
        return (
          mutation.type === "childList" &&
          mutation.target &&
          mutation.target.matches &&
          (mutation.target.matches('nav, aside, [role="navigation"]') ||
            mutation.target.closest('nav, aside, [role="navigation"]'))
        );
      });

      if (!isRelevant) return;

      // Faster recovery for better UX
      clearTimeout(vaultViewDebounceTimer);
      vaultViewDebounceTimer = setTimeout(() => {
        try {
          // Reattach hide observer and ensure list stays hidden
          hideDefaultChatsList(true);
          startNavListHideObserver();
          const hostOk = isVaultHostAttached();
          if (!hostOk) {
            log(
              "🔄 DOM changed, host missing/detached → re-rendering vault view",
            );
            // Vault rendering now handled by vaultSidebar.js module
          }
        } catch (e) {
          log("⚠️ Error in vault view observer:", e);
        }
      }, 150); // Faster 150ms debounce for better UX
    });
    vaultViewObserver.observe(document.body, {
      childList: true,
      subtree: true,
      // More specific observation to reduce noise
      attributeFilter: ["style", "class", "hidden"],
    });
  } else {
    devLog("🚫 Vault view mutation observers disabled for compatibility");
  }

  // 🗑️ DELETED: Old vault click observer (not needed with new vaultSidebar.js module)

  // 🗑️ DELETED: Old vault stability checker (not needed with new vaultSidebar.js module)

  // ==================================================================================
  // CHATGPT THINKING MONITOR - Play sound when ChatGPT finishes thinking
  // ==================================================================================

  let thinkingObserver = null;
  let isCurrentlyThinking = false;
  let thinkingStartTime = null;

  /*
  ╔═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
  ║                                                                                                                                                           ║
  ║   █████╗ ██╗   ██╗██████╗ ██╗ ██████╗     ███╗   ██╗ ██████╗ ████████╗██╗███████╗██╗ ██████╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗███████╗         ║
  ║  ██╔══██╗██║   ██║██╔══██╗██║██╔═══██╗    ████╗  ██║██╔═══██╗╚══██╔══╝██║██╔════╝██║██╔════╝██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║██╔════╝         ║
  ║  ███████║██║   ██║██║  ██║██║██║   ██║    ██╔██╗ ██║██║   ██║   ██║   ██║█████╗  ██║██║     ███████║   ██║   ██║██║   ██║██╔██╗ ██║███████╗         ║
  ║  ██╔══██║██║   ██║██║  ██║██║██║   ██║    ██║╚██╗██║██║   ██║   ██║   ██║██╔══╝  ██║██║     ██╔══██║   ██║   ██║██║   ██║██║╚██╗██║╚════██║         ║
  ║  ██║  ██║╚██████╔╝██████╔╝██║╚██████╔╝    ██║ ╚████║╚██████╔╝   ██║   ██║██║     ██║╚██████╗██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║███████║         ║
  ║  ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝     ╚═╝  ╚═══╝ ╚═════╝    ╚═╝   ╚═╝╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝         ║
  ║                                                                                                                                                           ║
  ║  ███╗   ███╗ █████╗ ███╗   ██╗ █████╗  ██████╗ ███████╗███╗   ███╗███████╗███╗   ██╗████████╗                                                          ║
  ║  ████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔════╝ ██╔════╝████╗ ████║██╔════╝████╗  ██║╚══██╔══╝                                                          ║
  ║  ██╔████╔██║███████║██╔██╗ ██║███████║██║  ███╗█████╗  ██╔████╔██║█████╗  ██╔██╗ ██║   ██║                                                             ║
  ║  ██║╚██╔╝██║██╔══██║██║╚██╗██║██╔══██║██║   ██║██╔══╝  ██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║                                                             ║
  ║  ██║ ╚═╝ ██║██║  ██║██║ ╚████║██║  ██║╚██████╔╝███████╗██║ ╚═╝ ██║███████╗██║ ╚████║   ██║                                                             ║
  ║  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝                                                             ║
  ║                                                                                                                                                           ║
  ║  Audio notification system for ChatGPT response completion and thinking state monitoring.                                                               ║
  ║  Manages sound settings, thinking observation, and completion notification triggers.                                                                    ║
  ║                                                                                                                                                           ║
  ║  Key Functions: loadAudioSettings(), observeThinkingState(), playCompletionSound(), manageThinkingObserver()                                           ║
  ║  Line Range: ~11545-11830                                                                                                                               ║
  ║                                                                                                                                                           ║
  ╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
  */

  // Audio settings state
  let audioNotificationsEnabled = true;
  let audioNotificationSound = "gentle";

  // Load audio settings from localStorage
  function loadAudioSettings() {
    try {
      const enabled = localStorage.getItem("sp_audio_notifications_enabled");
      audioNotificationsEnabled = enabled === null ? true : enabled === "1";

      const sound = localStorage.getItem("sp_audio_notification_sound");
      audioNotificationSound =
        sound && ["gentle", "chime", "pop", "beep"].includes(sound)
          ? sound
          : "gentle";

      log(
        `🔊 Audio settings loaded: enabled=${audioNotificationsEnabled}, sound=${audioNotificationSound}`,
      );
    } catch (error) {
      log("⚠️ Could not load audio settings:", error);
    }
  }

  // Listen for audio settings changes from the settings page
  window.addEventListener("message", function (event) {
    if (event.source !== window) return;

    if (event.data?.type === "sp-audio-settings-changed") {
      if (event.data.hasOwnProperty("enabled")) {
        audioNotificationsEnabled = event.data.enabled;
        log(
          `🔊 Audio notifications ${
            audioNotificationsEnabled ? "enabled" : "disabled"
          }`,
        );
      }
      if (event.data.hasOwnProperty("sound")) {
        audioNotificationSound = event.data.sound;
        log(
          `🔊 Audio notification sound changed to: ${audioNotificationSound}`,
        );
      }
    }

    // Listen for message overlay settings changes from the settings page
    if (event.data?.type === "sp-message-overlays-settings-changed") {
      if (event.data.hasOwnProperty("enabled")) {
        setOverlaysSetting(event.data.enabled);
        log(
          `🎛️ Message overlays ${
            event.data.enabled ? "enabled" : "disabled"
          } via settings`,
        );
      }
    }

    // Listen for styled textarea settings changes from the settings page
    if (event.data?.type === "sp-styled-textarea-settings-changed") {
      if (event.data.hasOwnProperty("enabled")) {
        log(
          `🎛️ Styled textarea ${
            event.data.enabled ? "enabled" : "disabled"
          } via settings`,
        );
        updateChatGPTTextareaStyling();
      }
    }
  });

  function playCompletionSound() {
    // Check if audio notifications are enabled
    if (!audioNotificationsEnabled) {
      log("🔇 Audio notifications disabled, showing toast instead");
      showThinkingCompletedToast();
      return;
    }

    try {
      // Create a completion sound using Web Audio API based on selected sound type
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure sound based on user preference
      switch (audioNotificationSound) {
        case "gentle":
          // Original gentle sound
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            600,
            audioContext.currentTime + 0.1,
          );
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(
            0.1,
            audioContext.currentTime + 0.05,
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.3,
          );
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;

        case "chime":
          // Pleasant chime sound - play multiple tones in sequence
          const frequencies = [523, 659, 784]; // C5, E5, G5
          frequencies.forEach((freq, index) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.frequency.setValueAtTime(
              freq,
              audioContext.currentTime + index * 0.1,
            );
            gain.gain.setValueAtTime(0, audioContext.currentTime + index * 0.1);
            gain.gain.linearRampToValueAtTime(
              0.06,
              audioContext.currentTime + index * 0.1 + 0.02,
            );
            gain.gain.exponentialRampToValueAtTime(
              0.01,
              audioContext.currentTime + index * 0.1 + 0.3,
            );
            osc.start(audioContext.currentTime + index * 0.1);
            osc.stop(audioContext.currentTime + index * 0.1 + 0.3);
          });
          break;

        case "pop":
          // Quick pop sound
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            200,
            audioContext.currentTime + 0.05,
          );
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(
            0.15,
            audioContext.currentTime + 0.01,
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.1,
          );
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
          break;

        case "beep":
          // Classic beep
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(
            0.12,
            audioContext.currentTime + 0.01,
          );
          gainNode.gain.linearRampToValueAtTime(
            0.12,
            audioContext.currentTime + 0.15,
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.2,
          );
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
          break;

        default:
          // Fallback to gentle
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            600,
            audioContext.currentTime + 0.1,
          );
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(
            0.1,
            audioContext.currentTime + 0.05,
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.3,
          );
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
      }

      log(
        `🔊 ChatGPT thinking completed - ${audioNotificationSound} sound played`,
      );
    } catch (error) {
      log("⚠️ Could not play completion sound:", error);
      // Fallback: show a toast notification
      showThinkingCompletedToast();
    }
  }

  function showThinkingCompletedToast() {
    // Create a subtle toast notification as fallback
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #00E0C6, #6A5ACD);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
      pointer-events: none;
    `;
    toast.textContent = "✨ ChatGPT response ready!";

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);

    log("📱 ChatGPT thinking completed - toast shown");
  }

  function monitorThinkingDiv() {
    if (thinkingObserver) {
      thinkingObserver.disconnect();
    }

    thinkingObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Check for added thinking divs
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const thinkingDiv =
              node.querySelector?.(".result-thinking") ||
              (node.classList?.contains("result-thinking") ? node : null);

            if (thinkingDiv) {
              if (!isCurrentlyThinking) {
                isCurrentlyThinking = true;
                thinkingStartTime = Date.now();
                log("🤔 ChatGPT started thinking...");
              }
            }
          }
        });

        // Check for removed thinking divs
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const thinkingDiv =
              node.querySelector?.(".result-thinking") ||
              (node.classList?.contains("result-thinking") ? node : null);

            if (thinkingDiv && isCurrentlyThinking) {
              const thinkingDuration = Date.now() - thinkingStartTime;
              log(`💭 ChatGPT finished thinking (${thinkingDuration}ms)`);

              isCurrentlyThinking = false;
              thinkingStartTime = null;

              // Play completion sound
              playCompletionSound();
            }
          }
        });

        // Also check for direct class changes on existing nodes
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const target = mutation.target;
          if (target.classList?.contains("result-thinking")) {
            if (!isCurrentlyThinking) {
              isCurrentlyThinking = true;
              thinkingStartTime = Date.now();
              log("🤔 ChatGPT started thinking (via class change)...");
            }
          }
        }
      });

      // Also check if thinking div disappeared by scanning current DOM
      if (isCurrentlyThinking) {
        const currentThinkingDiv = document.querySelector(".result-thinking");
        if (!currentThinkingDiv) {
          const thinkingDuration = Date.now() - thinkingStartTime;
          log(
            `💭 ChatGPT finished thinking (disappeared from DOM, ${thinkingDuration}ms)`,
          );

          isCurrentlyThinking = false;
          thinkingStartTime = null;

          // Play completion sound
          playCompletionSound();
        }
      }
    });

    // Observe the entire document for thinking div changes
    thinkingObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    log("👀 ChatGPT thinking monitor initialized");
  }

  // Initialize thinking monitor and load audio settings
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      loadAudioSettings();
      monitorThinkingDiv();
      updateChatGPTTextareaStyling();
    });
  } else {
    loadAudioSettings();
    monitorThinkingDiv();
    updateChatGPTTextareaStyling();
  }

  // Listen for scroll buttons setting changes
  window.addEventListener("sp-scroll-buttons-changed", (event) => {
    const { scrollButtonsEnabled } = event.detail || {};
    log(`🎨 Scroll buttons setting changed: ${scrollButtonsEnabled}`);

    const existingButtons = document.querySelector(".sp-scroll-buttons");

    if (scrollButtonsEnabled && !existingButtons) {
      // Create scroll buttons if they don't exist
      const scrollButtons = createScrollButtons(false);
      if (scrollButtons) {
        document.body.appendChild(scrollButtons);
        log("🎨 Scroll buttons created after setting change");
      }
    } else if (!scrollButtonsEnabled && existingButtons) {
      // Remove scroll buttons if they exist
      existingButtons.remove();
      log("🎨 Scroll buttons removed after setting change");
    }
  });

  // Listen for accent color changes and recreate buttons with new color
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data?.type !== "superprompt-accent-color-changed") return;

    log("🎨 Accent color changed, updating buttons and tabs");

    // Recreate scroll buttons with new color (only if they were visible before)
    const existingButtons = document.querySelector(".sp-scroll-buttons");
    if (existingButtons && existingButtons.style.display !== "none") {
      existingButtons.remove();
      const scrollButtons = createScrollButtons(false);
      if (scrollButtons) {
        // Preserve visibility state
        scrollButtons.style.display = isFloatingMenuOpen ? "none" : "flex";
        document.body.appendChild(scrollButtons);
      }
    }

    // Recreate notes tab with new color
    const existingTab = document.querySelector(".sp-note-tab");
    if (existingTab) {
      const conversationId = existingTab.getAttribute("data-conversation-id");
      if (conversationId) {
        conversationHasNotes(conversationId)
          .then((hasNote) => {
            existingTab.remove();
            const newTab = createNoteTab(conversationId, hasNote);
            if (
              newTab &&
              shouldShowNotesTab() &&
              !managerIsOpen &&
              !isFloatingMenuOpen
            ) {
              document.body.appendChild(newTab);
            }
          })
          .catch(() => {});
      }
    }
  });

  // Listen for floating menu state changes to hide/show scroll buttons and notes tab
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data;

    if (data?.type === "sp-floating-menu-state-change") {
      const { isMenuOpen } = data;

      // Update global state
      isFloatingMenuOpen = isMenuOpen;

      const scrollButtons = document.querySelector(".sp-scroll-buttons");
      const notesTab = document.querySelector(".sp-note-tab");
      const scrollNavToggle = document.querySelector(
        ".sp-scroll-nav-toggle-btn",
      );

      log(`🎨 Floating menu state changed: ${isMenuOpen ? "OPEN" : "CLOSED"}`);
      log(
        `🎨 Found scroll buttons: ${!!scrollButtons}, notes tab: ${!!notesTab}, scroll nav toggle: ${!!scrollNavToggle}`,
      );

      if (scrollButtons) {
        if (isMenuOpen) {
          // Hide scroll buttons when menu is open
          scrollButtons.style.display = "none";
          log("🎨 Scroll buttons hidden (menu opened)");
        } else {
          // Show scroll buttons when menu is closed
          scrollButtons.style.display = "flex";
          log("🎨 Scroll buttons shown (menu closed)");
        }
      } else {
        log("⚠️ Scroll buttons not found in DOM");
      }

      if (notesTab) {
        if (isMenuOpen) {
          // Hide notes tab when menu is open
          notesTab.style.display = "none";
          log("🎨 Notes tab hidden (menu opened)");
        } else {
          // Show notes tab when menu is closed
          notesTab.style.display = "flex";
          log("🎨 Notes tab shown (menu closed)");
        }
      } else {
        log("⚠️ Notes tab not found in DOM");
      }

      if (scrollNavToggle) {
        if (isMenuOpen) {
          // Hide scroll navigation toggle when menu is open
          scrollNavToggle.style.display = "none";
          log("🎨 Scroll nav toggle hidden (menu opened)");
        } else {
          // Show scroll navigation toggle when menu is closed
          scrollNavToggle.style.display = "flex";
          log("🎨 Scroll nav toggle shown (menu closed)");
        }
      } else {
        log("⚠️ Scroll nav toggle not found in DOM");
      }

      // Event-driven: re-evaluate Notes tab presence after menu state change
      try {
        if (typeof window._spScheduleNotesTabGuardCheck === "function") {
          window._spScheduleNotesTabGuardCheck();
        }
      } catch {}
    }
  });

  // ⏸️ Listen for extension pause/resume commands from content script
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data?.source !== "superprompt-content") return;
    if (event.data?.type !== "sp-extension-pause-state") return;

    const { paused } = event.data;

    if (paused) {
      window._spPauseExtension();
    } else {
      window._spResumeExtension();
    }
  });

  // ████████████████████████████████████████████████████████████████████████████
  // ██          CONTEXT MENU INJECTION - PROJECT: EXPORT CONVERSATIONS       ██
  // ████████████████████████████████████████████████████████████████████████████
  // Injects custom "Export Conversations" item into ChatGPT's PROJECT context menu
  // (Fixes incorrect placement of "Extract Prompts" in that menu.)

  function injectProjectExportConversationsMenuItem() {
    // Find the Radix dropdown menu content - try multiple selectors
    let menuContent = document.querySelector(
      '[role="menu"][data-radix-menu-content]',
    );

    // Fallback: try finding any role="menu" that looks like the PROJECT menu
    if (!menuContent) {
      const menus = document.querySelectorAll('[role="menu"]');
      devLog(
        `🔍 [SuperPrompt] Found ${menus.length} menu elements, searching for project menu...`,
      );
      for (const menu of menus) {
        const text = menu.textContent || "";
        // Project menu contains project-specific actions
        if (
          text.includes("Rename project") ||
          text.includes("Delete project") ||
          text.includes("Create folder from project")
        ) {
          menuContent = menu;
          devLog("✅ [SuperPrompt] Found project menu by content matching");
          break;
        }
      }
    }

    if (!menuContent) return;

    // If this isn't a project menu, do nothing.
    const menuText = menuContent.textContent || "";
    const isProjectMenu =
      menuText.includes("Rename project") ||
      menuText.includes("Delete project") ||
      menuText.includes("Create folder from project");
    if (!isProjectMenu) return;

    // Remove legacy injected item if present
    const legacyExtract = menuContent.querySelector(
      "[data-sp-extract-prompts]",
    );
    if (legacyExtract) {
      try {
        legacyExtract.remove();
      } catch {
        // ignore
      }
    }

    // Avoid duplicates (either ours or ChatGPT's own)
    if (menuContent.querySelector("[data-sp-export-conversations]")) return;
    if (menuText.includes("Export Conversations")) return;

    // Create the custom menu item
    const exportItem = document.createElement("div");
    exportItem.setAttribute("role", "menuitem");
    exportItem.setAttribute("tabindex", "0");
    exportItem.setAttribute("data-sp-export-conversations", "true");
    exportItem.setAttribute("data-orientation", "vertical");
    exportItem.setAttribute("data-radix-collection-item", "");
    exportItem.className = "group __menu-item gap-1.5";

    // Ensure it behaves like the other items
    exportItem.style.display = "flex";
    exportItem.style.alignItems = "center";
    exportItem.style.cursor = "pointer";

    // Icon container
    const iconDiv = document.createElement("div");
    iconDiv.className =
      "flex items-center justify-center group-disabled:opacity-50 group-data-disabled:opacity-50 icon";

    // SVG icon (download)
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.className = "icon";

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4");
    const path2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polyline",
    );
    path2.setAttribute("points", "7 10 12 15 17 10");
    const path3 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    path3.setAttribute("x1", "12");
    path3.setAttribute("y1", "15");
    path3.setAttribute("x2", "12");
    path3.setAttribute("y2", "3");

    svg.appendChild(path);
    svg.appendChild(path2);
    svg.appendChild(path3);
    iconDiv.appendChild(svg);

    // Label + Pro badge container
    const labelWrap = document.createElement("span");
    labelWrap.style.display = "flex";
    labelWrap.style.alignItems = "center";
    labelWrap.style.gap = "8px";
    labelWrap.style.flex = "1";
    labelWrap.style.minWidth = "0";

    const label = document.createElement("span");
    label.textContent = t("exportConversations");
    labelWrap.appendChild(label);

    const badge = document.createElement("span");
    badge.textContent = t("proBadge");
    badge.style.marginLeft = "auto";
    badge.style.fontSize = "11px";
    badge.style.fontWeight = "700";
    badge.style.padding = "3px 8px";
    badge.style.borderRadius = "4px";
    badge.style.backgroundColor = "var(--color-accent, #14b8a6)";
    badge.style.color = "#ffffff";
    badge.style.textTransform = "uppercase";
    badge.style.letterSpacing = "0.5px";
    labelWrap.appendChild(badge);

    exportItem.appendChild(iconDiv);
    exportItem.appendChild(labelWrap);

    exportItem.addEventListener("mouseenter", () => {
      exportItem.setAttribute("data-active", "");
    });
    exportItem.addEventListener("mouseleave", () => {
      exportItem.removeAttribute("data-active");
    });

    exportItem.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        menuContent.remove();
      } catch {
        // ignore
      }

      // Placeholder hook: implementation will be added later.
      window.postMessage(
        {
          type: "sp-project-export-conversations-clicked",
          source: "chat-gpt-page-listener",
          href: window.location.href,
        },
        "*",
      );
    });

    exportItem.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        exportItem.click();
      }
    });

    // Insert as first item in the menu
    const firstItem = menuContent.querySelector('[role="menuitem"]');
    if (firstItem) {
      menuContent.insertBefore(exportItem, firstItem);
    } else {
      menuContent.appendChild(exportItem);
    }
  }

  // ████████████████████████████████████████████████████████████████████████████
  // ██          CONTEXT MENU INJECTION - CONVERSATION: EXTRACT PROMPTS       ██
  // ████████████████████████████████████████████████████████████████████████████
  // Injects custom "Extract Prompts" menu item into ChatGPT's CONVERSATION context menu
  // IMPORTANT: this must NOT inject into the PROJECT sidebar menu.

  function injectExtractPromptsMenuItem() {
    // Find the Radix dropdown menu content - try multiple selectors
    let menuContent = document.querySelector(
      '[role="menu"][data-radix-menu-content]',
    );

    // Fallback: try finding any role="menu" that looks like the conversation context menu
    if (!menuContent) {
      const menus = document.querySelectorAll('[role="menu"]');
      devLog(
        `🔍 [SuperPrompt] Found ${menus.length} menu elements, searching for conversation menu...`,
      );
      for (const menu of menus) {
        const text = menu.textContent || "";

        // Explicitly ignore the PROJECT menu ("Delete project" etc.)
        const isProjectMenu =
          text.includes("Rename project") ||
          text.includes("Delete project") ||
          text.includes("Create folder from project");
        if (isProjectMenu) continue;

        // Conversation menu signals (avoid matching only on generic "Delete")
        const hasStrongConversationSignal =
          text.includes("Move to project") ||
          text.includes("Pin chat") ||
          text.includes("Archive") ||
          text.includes("Report");

        if (hasStrongConversationSignal) {
          menuContent = menu;
          devLog(
            "✅ [SuperPrompt] Found conversation menu by content matching",
          );
          break;
        }
      }
    }

    if (!menuContent) return;

    const menuText = menuContent.textContent || "";
    const isProjectMenu =
      menuText.includes("Rename project") ||
      menuText.includes("Delete project") ||
      menuText.includes("Create folder from project");
    if (isProjectMenu) return;

    const hasStrongConversationSignal =
      menuText.includes("Move to project") ||
      menuText.includes("Pin chat") ||
      menuText.includes("Archive") ||
      menuText.includes("Report");
    if (!hasStrongConversationSignal) return;

    // Check if we already injected our item
    if (menuContent.querySelector("[data-sp-extract-prompts]")) return;

    // Create the custom menu item
    const extractItem = document.createElement("div");
    extractItem.setAttribute("role", "menuitem");
    extractItem.setAttribute("tabindex", "0");
    extractItem.setAttribute("data-sp-extract-prompts", "true");
    extractItem.setAttribute("data-orientation", "vertical");
    extractItem.setAttribute("data-radix-collection-item", "");
    extractItem.className = "group __menu-item gap-1.5";

    // Ensure it behaves like the other items
    extractItem.style.display = "flex";
    extractItem.style.alignItems = "center";
    extractItem.style.cursor = "pointer";

    // Icon container
    const iconDiv = document.createElement("div");
    iconDiv.className =
      "flex items-center justify-center group-disabled:opacity-50 group-data-disabled:opacity-50 icon";

    // SVG icon (download)
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.className = "icon";

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4");
    const path2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polyline",
    );
    path2.setAttribute("points", "7 10 12 15 17 10");
    const path3 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    path3.setAttribute("x1", "12");
    path3.setAttribute("y1", "15");
    path3.setAttribute("x2", "12");
    path3.setAttribute("y2", "3");

    svg.appendChild(path);
    svg.appendChild(path2);
    svg.appendChild(path3);
    iconDiv.appendChild(svg);

    const label = document.createTextNode(t("extractPrompts"));

    extractItem.appendChild(iconDiv);
    extractItem.appendChild(label);

    // Hover state handlers
    extractItem.addEventListener("mouseenter", () => {
      extractItem.setAttribute("data-active", "");
    });

    extractItem.addEventListener("mouseleave", () => {
      extractItem.removeAttribute("data-active");
    });

    // Click handler
    extractItem.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        menuContent.remove();
      } catch {
        // ignore
      }

      // Get current conversation ID from URL
      // Handles both:
      // - Normal: /c/{conversationId}
      // - Project: /g/{gizmo-id}/{project-name}/c/{conversationId}
      const pathMatch = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
      if (!pathMatch) {
        window.postMessage(
          {
            type: "sp-extract-prompts-error",
            error: "No conversation ID found in URL",
            source: "chat-gpt-page-listener",
          },
          "*",
        );
        return;
      }

      const conversationId = pathMatch[1];

      try {
        // Get access token
        const sessionResponse = await fetch(
          "https://chatgpt.com/api/auth/session",
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!sessionResponse.ok) {
          throw new Error("Failed to get session data");
        }

        const sessionData = await sessionResponse.json();
        const accessToken = sessionData.accessToken;

        if (!accessToken) {
          throw new Error(
            "No access token in session. Please refresh the page and try again.",
          );
        }

        // Fetch conversation data
        const response = await fetch(
          `https://chatgpt.com/backend-api/conversation/${conversationId}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch conversation: ${response.status}`);
        }

        const conversationData = await response.json();

        // Extract user prompts from the conversation mapping
        const prompts = [];
        const mapping = conversationData.mapping || {};

        for (const nodeId in mapping) {
          const node = mapping[nodeId];
          const message = node.message;

          if (
            message &&
            message.author &&
            message.author.role === "user" &&
            message.content &&
            message.content.content_type === "text" &&
            message.content.parts &&
            message.content.parts.length > 0
          ) {
            const promptText = message.content.parts.join("\n").trim();
            if (promptText) {
              prompts.push({
                text: promptText,
                timestamp: message.create_time,
                messageId: message.id,
              });
            }
          }
        }

        // Send to content script
        window.postMessage(
          {
            type: "sp-extract-prompts-success",
            conversationId: conversationId,
            conversationTitle:
              conversationData.title || "Untitled Conversation",
            prompts: prompts,
            source: "chat-gpt-page-listener",
          },
          "*",
        );
      } catch (error) {
        window.postMessage(
          {
            type: "sp-extract-prompts-error",
            error: error?.message || String(error),
            source: "chat-gpt-page-listener",
          },
          "*",
        );
      }
    });

    // Keyboard support (Enter/Space)
    extractItem.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        extractItem.click();
      }
    });

    // Insert as the first item when possible
    const firstItem = menuContent.querySelector('[role="menuitem"]');
    if (firstItem) {
      menuContent.insertBefore(extractItem, firstItem);
    } else {
      menuContent.appendChild(extractItem);
    }
  }

  // Monitor DOM for context menu appearance using MutationObserver
  const contextMenuObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if this is the Radix popper wrapper
          if (
            node.hasAttribute &&
            node.hasAttribute("data-radix-popper-content-wrapper")
          ) {
            // Small delay to ensure menu is fully rendered
            setTimeout(() => {
              injectProjectExportConversationsMenuItem();
              injectExtractPromptsMenuItem();
            }, 10);
          }
          // Also check children
          if (node.querySelector) {
            const menu = node.querySelector(
              "[data-radix-popper-content-wrapper]",
            );
            if (menu) {
              setTimeout(() => {
                injectProjectExportConversationsMenuItem();
                injectExtractPromptsMenuItem();
              }, 10);
            }
          }
        }
      }
    }
  });

  contextMenuObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log("🎯 [SuperPrompt] Context menu injection system initialized");
})();
