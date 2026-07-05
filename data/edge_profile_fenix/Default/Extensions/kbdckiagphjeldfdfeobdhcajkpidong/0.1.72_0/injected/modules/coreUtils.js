
  

﻿/**
 * SuperPrompt Core Utilities Module
 * Navigation safety, DOM utilities, and helper functions
 * Extracted from chat-gpt-page-listener.js for better maintainability
 */

(function () {
  "use strict";

  // Prevent multiple initialization
  if (window.SuperPromptCoreUtils) {
    return;
  }

  // Only log module loading in debug mode
  if (window.location.search.includes("debug=true")) {
    devLog("[SP-CoreUtils] Initializing Core Utilities module...");
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                        NAVIGATION SAFETY SYSTEM                       ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Navigation state management
  let isNewChatCreation = false;
  let navigationStartTime = 0;
  let hasGlobalError = false;
  let navSessionActive = false;
  let spCurrentUrl = window.location.href;

  const NAVIGATION_SAFE_DELAY = 3000; // 3 seconds pause after navigation starts
  const SMART_NAVIGATION_PAUSE = true;

  // Detect new chat creation early
  function detectNewChatCreation() {
    const isNewChatUrl = window.location.pathname === "/";
    const wasInChat = window.location.pathname.includes("/c/");

    if (
      isNewChatUrl &&
      (wasInChat || document.querySelector('[data-testid="conversation-turn"]'))
    ) {
      devLog(
        "🚨 [SP-CoreUtils] NEW CHAT CREATION DETECTED - Entering safe mode"
      );
      isNewChatCreation = true;
      navigationStartTime = Date.now();

      // Auto-recovery after delay
      setTimeout(() => {
        devLog(
          "🚨 [SP-CoreUtils] Navigation safe period ended - Resuming operations"
        );
        isNewChatCreation = false;
      }, NAVIGATION_SAFE_DELAY);

      return true;
    }
    return false;
  }

  // Monitor URL changes for new chat detection
  function onNavigationChange() {
    if (SMART_NAVIGATION_PAUSE && window.location.href !== spCurrentUrl) {
      devLog(
        "🚨 [SP-CoreUtils] URL changed from",
        spCurrentUrl,
        "to",
        window.location.href
      );
      spCurrentUrl = window.location.href;
      detectNewChatCreation();
    }
  }

  // Enhanced safety check function
  function isSafeToOperate() {
    // Not safe during new chat creation
    if (isNewChatCreation) {
      return false;
    }

    // Not safe if we detected DOM errors
    if (
      hasGlobalError &&
      Date.now() - navigationStartTime < NAVIGATION_SAFE_DELAY
    ) {
      return false;
    }

    // Not safe during existing navigation session
    if (navSessionActive) {
      return false;
    }

    return true;
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                            DOM UTILITIES                               ██
  // ██████████████████████████████████████████████████████████████████████████████

  function isPromptField(el) {
    // Ignore fields inside SuperPrompt UI
    try {
      if (el && el.closest && el.closest("[data-superprompt]")) {
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
        return false;
      }
      if (el && el.className && el.className.includes("superprompt")) {
        return false;
      }
    } catch {}

    // More flexible check for prompt fields
    return (
      el &&
      (el.tagName === "TEXTAREA" ||
        el.contentEditable === "true" ||
        el.getAttribute("contenteditable") === "true" ||
        el.hasAttribute("contenteditable"))
    );
  }

  function extractText(el) {
    return el?.value || el?.innerText || el?.textContent || "";
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
        ) {
          return true;
        }
      }
      // traverse up a few levels
      let p = el.parentElement;
      let steps = 0;
      while (p && steps++ < 5) {
        if (
          p.hasAttribute &&
          (p.hasAttribute("data-reactroot") || p.hasAttribute("data-reactid"))
        ) {
          return true;
        }
        p = p.parentElement;
      }
    } catch {}
    return false;
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                           LOGGING UTILITIES                            ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Centralized logging bridge for injected context → content script logger
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
        "*"
      );
    } catch (_) {
      // swallow – logging must never break functionality
    }
  }

  // Public logging helpers
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

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                          UTILITY FUNCTIONS                             ██
  // ██████████████████████████████████████████████████████████████████████████████

  function getCurrentConversationId() {
    const match = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func.apply(this, args);
      }
    };
  }

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                           ERROR HANDLING                               ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Global error handler to prevent crashes
  window.addEventListener("error", (e) => {
    if (e.error && e.error.message && e.error.message.includes("removeChild")) {
      devLog(
        "🚨 [SP-CoreUtils] Detected removeChild error, entering safe mode"
      );
      hasGlobalError = true;
      isNewChatCreation = true;
      navigationStartTime = Date.now();
    }
  });

  // ██████████████████████████████████████████████████████████████████████████████
  // ██                           MODULE EXPORT                                ██
  // ██████████████████████████████████████████████████████████████████████████████

  // Export the module API
  window.SuperPromptCoreUtils = {
    // Navigation Safety
    isSafeToOperate,
    detectNewChatCreation,
    onNavigationChange,

    // DOM Utilities
    isPromptField,
    extractText,
    isReactNode,

    // Logging
    spLog,
    spInfo,
    spWarn,
    spError,
    log,
    logError,

    // Utilities
    getCurrentConversationId,
    escapeHtml,
    debounce,
    throttle,

    // State access (read-only)
    getNavigationState: () => ({
      isNewChatCreation,
      navigationStartTime,
      hasGlobalError,
      navSessionActive,
      currentUrl: spCurrentUrl,
    }),

    // Theme detection and styling
    isDarkTheme: () => {
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
    },

    getAccentColorFallback: () => {
      try {
        const rs = window.getComputedStyle(document.documentElement);
        const v = (rs.getPropertyValue("--color-accent") || "").trim();
        if (v) return v;
      } catch {}
      return "#38bdf8"; // cyan-400 fallback
    },

    // Logging utilities
    spPostLog: (level, argsArray) => {
      try {
        // Convert arguments to safe, serializable strings
        const safeArgs = (argsArray || []).map((v) => {
          try {
            if (v instanceof Error) return `${v.name}: ${v.message}`;
            if (typeof v === "string") return v;
            if (typeof v === "number" || typeof v === "boolean")
              return String(v);
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
          "*"
        );
      } catch (_) {
        // swallow – logging must never break functionality
      }
    },

    log: (...args) => {
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
    },

    // Internal state setters (for module coordination)
    _setNavSessionActive: (active) => {
      navSessionActive = active;
    },
    _setHasGlobalError: (error) => {
      hasGlobalError = error;
    },
  };

  // Only log success in debug mode
  if (window.location.search.includes("debug=true")) {
    devLog(
      "✅ [SP-CoreUtils] Core Utilities module initialized successfully"
    );
  }
})();
